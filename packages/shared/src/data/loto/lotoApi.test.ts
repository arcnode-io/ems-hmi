import { clearLock, fetchLoto, fetchLotoHistory, setLock, type LotoFetch, type LotoInit } from "./lotoApi";

const LOCK = {
  id: 12,
  device_id: "bess_module_01",
  holder_name: "J. Narvaez",
  permit_ref: "WO-4471",
  set_at: "2026-10-10T19:04:12.345Z",
  set_by_role: "operator",
  cleared_at: null,
  cleared_by_role: null,
};

/** Fake fetch: records every call, answers with one canned status + body. */
function fakeFetch(status: number, body: unknown): { fn: LotoFetch; calls: { url: string; init: LotoInit }[] } {
  const calls: { url: string; init: LotoInit }[] = [];
  const fn: LotoFetch = (url, init) => {
    calls.push({ url, init });
    return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
  };
  return { fn, calls };
}

describe("lotoApi", () => {
  it("reads active locks and the expanded locked set", async () => {
    // Arrange
    const { fn, calls } = fakeFetch(200, { locks: [LOCK], locked_devices: ["bess_module_01", "bess_rack_01"] });

    // Act
    const snap = await fetchLoto("/api", fn);

    // Assert
    expect([calls[0].url, snap.locks[0].holder_name, snap.locked_devices]).toEqual([
      "/api/loto",
      "J. Narvaez",
      ["bess_module_01", "bess_rack_01"],
    ]);
  });

  it("reads a device's history by device_id", async () => {
    // Arrange
    const { fn, calls } = fakeFetch(200, [LOCK]);

    // Act
    const rows = await fetchLotoHistory("/api", "bess_module_01", fn);

    // Assert
    expect([calls[0].url, rows.length]).toEqual(["/api/loto/history?device_id=bess_module_01", 1]);
  });

  it("sets a lock with the operator token and a JSON body", async () => {
    // Arrange
    const { fn, calls } = fakeFetch(201, LOCK);

    // Act
    const lock = await setLock({ baseUri: "/api", token: "tok" }, "bess_module_01", { holder_name: "J. Narvaez", permit_ref: null }, fn);

    // Assert
    expect([calls[0].url, calls[0].init, lock.id]).toEqual([
      "/api/devices/bess_module_01/loto",
      {
        method: "POST",
        headers: { Authorization: "Bearer tok", "Content-Type": "application/json" },
        body: JSON.stringify({ holder_name: "J. Narvaez", permit_ref: null }),
      },
      12,
    ]);
  });

  it("clears one lock by id", async () => {
    // Arrange
    const { fn, calls } = fakeFetch(200, { ...LOCK, cleared_at: "2026-10-10T20:00:00.000Z", cleared_by_role: "operator" });

    // Act
    const lock = await clearLock({ baseUri: "/api", token: "tok" }, 12, fn);

    // Assert
    expect([calls[0].url, calls[0].init.method, lock.cleared_at]).toEqual(["/api/loto/12", "DELETE", "2026-10-10T20:00:00.000Z"]);
  });

  it("explains a duplicate holder in the operator's terms", async () => {
    // Arrange
    const { fn } = fakeFetch(409, { statusCode: 409, message: "holder already holds an active lock", error: "Conflict" });

    // Act
    const attempt = setLock({ baseUri: "/api", token: "tok" }, "bess_module_01", { holder_name: "J. Narvaez", permit_ref: null }, fn);

    // Assert
    await expect(attempt).rejects.toThrow("J. Narvaez already holds a lock on this device.");
  });

  it("passes the server's message through on a 400", async () => {
    // Arrange
    const { fn } = fakeFetch(400, { statusCode: 400, message: ["holder_name must be 120 characters or fewer"], error: "Bad Request" });

    // Act
    const attempt = setLock({ baseUri: "/api", token: "tok" }, "bess_module_01", { holder_name: "x", permit_ref: null }, fn);

    // Assert
    await expect(attempt).rejects.toThrow("holder_name must be 120 characters or fewer");
  });
});
