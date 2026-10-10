import { clearLock, fetchLoto, fetchLotoHistory, setLock } from "./lotoApi";
import { createMockLotoFetch } from "./mockLotoFetch";

const DEVICES = {
  bess_module_01: { parent: null },
  bess_rack_01: { parent: "bess_module_01" },
  bess_rack_02: { parent: "bess_module_01" },
  bess_module_02: { parent: null },
};
const WRITER = { baseUri: "", token: "mock" };

function arrange(): ReturnType<typeof createMockLotoFetch> {
  return createMockLotoFetch(() => DEVICES, () => new Date("2026-10-10T19:00:00.000Z"));
}

describe("mockLotoFetch", () => {
  it("locks a module and its racks", async () => {
    // Arrange
    const fetchFn = arrange();

    // Act
    await setLock(WRITER, "bess_module_01", { holder_name: "Ann", permit_ref: null }, fetchFn);
    const snap = await fetchLoto("", fetchFn);

    // Assert
    expect(snap.locked_devices).toEqual(["bess_module_01", "bess_rack_01", "bess_rack_02"]);
  });

  it("keeps the device locked while a second holder's lock stands", async () => {
    // Arrange
    const fetchFn = arrange();
    const first = await setLock(WRITER, "bess_module_01", { holder_name: "Ann", permit_ref: null }, fetchFn);
    await setLock(WRITER, "bess_module_01", { holder_name: "Bo", permit_ref: "WO-1" }, fetchFn);

    // Act
    await clearLock(WRITER, first.id, fetchFn);
    const snap = await fetchLoto("", fetchFn);

    // Assert
    expect([snap.locks.map((l) => l.holder_name), snap.locked_devices.includes("bess_module_01")]).toEqual([["Bo"], true]);
  });

  it("refuses the same holder twice, ignoring case and spaces", async () => {
    // Arrange
    const fetchFn = arrange();
    await setLock(WRITER, "bess_module_01", { holder_name: "Ann", permit_ref: null }, fetchFn);

    // Act
    const again = setLock(WRITER, "bess_module_01", { holder_name: "  ann ", permit_ref: null }, fetchFn);

    // Assert
    await expect(again).rejects.toMatchObject({ status: 409 });
  });

  it("refuses a blank holder, an unknown device and a second clear", async () => {
    // Arrange
    const fetchFn = arrange();
    const lock = await setLock(WRITER, "bess_module_02", { holder_name: "Ann", permit_ref: null }, fetchFn);
    await clearLock(WRITER, lock.id, fetchFn);

    // Act
    const statuses = await Promise.all([
      setLock(WRITER, "bess_module_01", { holder_name: "  ", permit_ref: null }, fetchFn).catch((e: { status: number }) => e.status),
      setLock(WRITER, "nope", { holder_name: "Ann", permit_ref: null }, fetchFn).catch((e: { status: number }) => e.status),
      clearLock(WRITER, lock.id, fetchFn).catch((e: { status: number }) => e.status),
    ]);

    // Assert
    expect(statuses).toEqual([400, 404, 409]);
  });

  it("returns a device's history newest first, cleared rows included", async () => {
    // Arrange
    const fetchFn = arrange();
    const first = await setLock(WRITER, "bess_module_01", { holder_name: "Ann", permit_ref: null }, fetchFn);
    await setLock(WRITER, "bess_module_01", { holder_name: "Bo", permit_ref: null }, fetchFn);
    await clearLock(WRITER, first.id, fetchFn);

    // Act
    const rows = await fetchLotoHistory("", "bess_module_01", fetchFn);

    // Assert
    expect(rows.map((r) => [r.holder_name, r.cleared_at !== null])).toEqual([["Bo", false], ["Ann", true]]);
  });
});
