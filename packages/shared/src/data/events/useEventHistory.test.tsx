import React from "react";
import { act, renderHook } from "@testing-library/react";
import { DeploymentIdentityProvider, type DeploymentIdentityBase } from "../deployment/DeploymentIdentityProvider";
import { AuthContext, type AuthState } from "../auth/AuthProvider";
import type { DeploymentMode } from "../deployment/deploymentMode";
import type { EventRow, EventsFetch } from "./eventsApi";
import { REFRESH_MS, useEventHistory } from "./useEventHistory";

const AUTH: AuthState = {
  status: "authenticated", token: "tok", role: "operator",
  login: () => Promise.resolve(), logout: () => undefined,
};

const row = (id: number): EventRow => ({
  id, occurredAt: `2026-10-10T18:0${id}:00Z`, type: "DISPATCH_MODE_SET", subject: "dispatch_mode",
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

/** Fake server: each call returns the log as it stands. */
function server(log: EventRow[]): { fetchFn: EventsFetch; urls: string[] } {
  const urls: string[] = [];
  return {
    urls,
    fetchFn: (url) => {
      urls.push(url);
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([...log]) });
    },
  };
}

const flush = async (ms = 0): Promise<void> => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
    await Promise.resolve();
  });
};

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("useEventHistory", () => {
  it("loads the log newest first, then picks up a new row on the next refresh", async () => {
    // Arrange
    const log = [row(1), row(2)];
    const { fetchFn, urls } = server(log);
    const { result } = renderHook(() => useEventHistory(fetchFn), { wrapper: wrapperFor("deployed") });
    await flush();
    const first = result.current;

    // Act
    log.push(row(3));
    await flush(REFRESH_MS);

    // Assert
    expect({
      first: first.status === "ready" ? first.rows.map((r) => r.id) : first.status,
      next: result.current.status === "ready" ? result.current.rows.map((r) => r.id) : result.current.status,
      base: urls[0]?.startsWith("/der-control/events?"),
    }).toEqual({ first: [2, 1], next: [3, 2, 1], base: true });
  });

  it("is unavailable on in-browser mock builds — there's no der-control-api to ask", async () => {
    // Arrange
    const { fetchFn, urls } = server([row(1)]);

    // Act
    const { result } = renderHook(() => useEventHistory(fetchFn), { wrapper: wrapperFor("local") });
    await flush(REFRESH_MS);

    // Assert
    expect({ status: result.current.status, calls: urls.length }).toEqual({ status: "unavailable", calls: 0 });
  });

  it("reports an error when the server refuses, rather than an empty history", async () => {
    // Arrange
    const fetchFn: EventsFetch = () => Promise.resolve({ ok: false, status: 502, json: () => Promise.resolve(null) });

    // Act
    const { result } = renderHook(() => useEventHistory(fetchFn), { wrapper: wrapperFor("deployed") });
    await flush();

    // Assert
    expect(result.current.status).toBe("error");
  });
});
