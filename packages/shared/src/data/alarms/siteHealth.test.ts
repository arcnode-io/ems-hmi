import { siteHealth } from "./siteHealth";
import type { ActiveAlarm } from "./useAlarms";

const ALARM: ActiveAlarm = {
  deviceId: "bess_rack_1",
  deviceDisplayName: "BESS-1",
  measurementName: "cell_temp",
  measurementLabel: "Cell temp",
  severity: "alarm",
  displayValue: "61.00 C",
  limitLabel: null,
  ts: "2026-10-17T00:00:00Z",
};

describe("siteHealth", () => {
  it("is nominal only when every monitored reading has come in and nothing trips", () => {
    // Arrange / Act
    const health = siteHealth({ alarms: [], watched: 4, reporting: 4, unprovisioned: 0 });

    // Assert
    expect(health).toEqual({ level: "nominal", alarmCount: 0, warnCount: 0, reason: null });
  });

  it("is unknown, not nominal, when silence is all there is", () => {
    // Arrange
    const cases = [
      { alarms: [], watched: 4, reporting: 1, unprovisioned: 0 },
      { alarms: [], watched: 0, reporting: 0, unprovisioned: 0 },
      { alarms: [], watched: 4, reporting: 4, unprovisioned: 2 },
    ];

    // Act
    const health = cases.map((c) => [siteHealth(c).level, siteHealth(c).reason]);

    // Assert
    expect(health).toEqual([
      ["unknown", { kind: "partial", reporting: 1, watched: 4 }],
      ["unknown", { kind: "no_limits" }],
      ["unknown", { kind: "unprovisioned", count: 2 }],
    ]);
  });

  it("still raises a reported alarm while the rest of the site is unknown", () => {
    // Arrange / Act
    const health = siteHealth({ alarms: [ALARM, { ...ALARM, severity: "warn" }], watched: 4, reporting: 1, unprovisioned: 3 });

    // Assert
    expect([health.level, health.alarmCount, health.warnCount]).toEqual(["alarm", 1, 1]);
  });
});
