import React from "react";
import { act, renderHook } from "@testing-library/react";
import { DeploymentIdentityProvider, type DeploymentIdentityBase } from "../deployment/DeploymentIdentityProvider";
import { AuthContext, type AuthState } from "../auth/AuthProvider";
import type { DeploymentMode } from "../deployment/deploymentMode";
import { PAGE_SIZE, type EventRow, type EventsFetch } from "./eventsApi";
import { DEFAULT_FILTER, type EventFilter } from "./eventFilter";
import { REFRESH_MS } from "./useEventHistory";
import { useEventLog, type EventLog } from "./useEventLog";

const AUTH: AuthState = {
  status: "authenticated", token: "tok", role: "operator",
  login: () => Promise.resolve(), logout: () => undefined,
};

const row = (id: number): EventRow => ({
  id, occurredAt: "2026-10-10T18:00:00Z", type: "DISPATCH_MODE_SET", subject: "dispatch_mode",
  actor: "operator", program: null, status: null, state: null, value: null, detail: "AUTO",
});

function wrapperFor(mode: DeploymentMode) {
  const base: DeploymentIdentityBase = {
    name: "T", host: "h", siteId: "s", mode, chatApiUri: "", deviceApiUri: "/api", derControlUri: "/der-control",
  };
  return ({ children }: { children: React.ReactNode }): React.ReactElement => (
    <DeploymentIdentityProvider base={base}>
      <AuthContext.Provider value={mode === "deployed" ? AUTH : null}>{children}</AuthContext.Provider>
    </DeploymentIdentityProvider>
  );
}

/** Fake der-control-api: newest-first pages over `log`, plus retention. */
function server(log: EventRow[]): { fetchFn: EventsFetch; urls: string[] } {
  const urls: string[] = [];
  const fetchFn: EventsFetch = (url) => {
    urls.push(url);
    const parsed = new URL(url, "http://h");
    const before = parsed.searchParams.get("before");
    const body = parsed.pathname.endsWith("/retention")
      ? { days: 90 }
      : [...log]
          .filter((r) => before === null || r.id < Number(before))
          .sort((a, b) => b.id - a.id)
          .slice(0, PAGE_SIZE);
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  };
  return { fetchFn, urls };
}

const ids = (log: EventLog): number[] | string => (log.status === "ready" ? log.rows.map((r) => r.id) : log.status);

const flush = async (ms = 0): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    for (let i = 0; i < 4; i++) await Promise.resolve();
  });
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("useEventLog", () => {
  it("pages back through the log until the start, newest first", async () => {
    // Arrange — 60 rows: one full page, then 10
    const { fetchFn } = server(Array.from({ length: 60 }, (_, i) => row(i + 1)));
    const { result } = renderHook(() => useEventLog(DEFAULT_FILTER, fetchFn), { wrapper: wrapperFor("deployed") });
    await flush();
    const firstPage = ids(result.current);

    // Act
    await act(async () => result.current.status === "ready" && result.current.loadOlder());
    await flush();
    const afterOlder = result.current;
    await act(async () => result.current.status === "ready" && result.current.loadOlder());
    await flush();

    // Assert
    expect({
      firstTop: Array.isArray(firstPage) ? [firstPage[0], firstPage.length] : firstPage,
      afterOlder: afterOlder.status === "ready" ? [afterOlder.rows.length, afterOlder.rows.at(-1)?.id, afterOlder.end] : afterOlder.status,
      end: result.current.status === "ready" ? result.current.end : result.current.status,
      retentionDays: result.current.retentionDays,
    }).toEqual({ firstTop: [60, 50], afterOlder: [60, 1, false], end: true, retentionDays: 90 });
  });

  it("adds new events at the top while the page is open", async () => {
    // Arrange
    const log = [row(1), row(2)];
    const { fetchFn } = server(log);
    const { result } = renderHook(() => useEventLog(DEFAULT_FILTER, fetchFn), { wrapper: wrapperFor("deployed") });
    await flush();

    // Act
    log.push(row(3));
    await flush(REFRESH_MS);

    // Assert
    expect(ids(result.current)).toEqual([3, 2, 1]);
  });

  it("starts over from the newest page when the filters change", async () => {
    // Arrange
    const { fetchFn, urls } = server([row(1)]);
    const { rerender } = renderHook(({ filter }: { filter: EventFilter }) => useEventLog(filter, fetchFn), {
      wrapper: wrapperFor("deployed"),
      initialProps: { filter: DEFAULT_FILTER },
    });
    await flush();

    // Act
    rerender({ filter: { ...DEFAULT_FILTER, kind: "reserve" } });
    await flush();

    // Assert
    expect(urls.filter((u) => u.includes("types=OPERATOR_RESERVE_SET") && u.includes("order=desc")).length).toBe(1);
  });

  it("shows newest first even if the server answers oldest first (a der-control-api without order=desc)", async () => {
    // Arrange
    const fetchFn: EventsFetch = (url) =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(url.includes("/retention") ? { days: 90 } : [row(1), row(2)]),
      });

    // Act
    const { result } = renderHook(() => useEventLog(DEFAULT_FILTER, fetchFn), { wrapper: wrapperFor("deployed") });
    await flush();

    // Assert
    expect(ids(result.current)).toEqual([2, 1]);
  });

  it("is unavailable on in-browser mock builds", async () => {
    // Arrange
    const { fetchFn, urls } = server([row(1)]);

    // Act
    const { result } = renderHook(() => useEventLog(DEFAULT_FILTER, fetchFn), { wrapper: wrapperFor("local") });
    await flush(REFRESH_MS);

    // Assert
    expect({ status: result.current.status, calls: urls.length }).toEqual({ status: "unavailable", calls: 0 });
  });
});
