import { healthLine } from "./healthLine";
import type { SiteHealth } from "../../../../data/alarms/siteHealth";

const base: SiteHealth = { level: "nominal", alarmCount: 0, warnCount: 0, reason: null };

describe("healthLine", () => {
  it("says why the site is unknown instead of calling it nominal", () => {
    // Arrange
    const cases: SiteHealth[] = [
      { ...base, level: "unknown", reason: { kind: "unprovisioned", count: 237 } },
      { ...base, level: "unknown", reason: { kind: "no_limits" } },
      { ...base, level: "unknown", reason: { kind: "partial", reporting: 3, watched: 12 } },
    ];

    // Act
    const lines = cases.map((h) => healthLine(h, 17));

    // Assert
    expect(lines).toEqual([
      { headline: "Site status unknown", detail: "237 devices awaiting commissioning" },
      { headline: "Site status unknown", detail: "No alarm limits configured" },
      { headline: "Site status unknown", detail: "3 of 12 monitored readings reporting" },
    ]);
  });

  it("calls the site nominal only with proof, and leads with alarms over warnings", () => {
    // Arrange / Act
    const lines = [
      healthLine(base, 17),
      healthLine({ ...base, level: "alarm", alarmCount: 1, warnCount: 2 }, 17),
      healthLine({ ...base, level: "warn", warnCount: 2 }, 1),
    ];

    // Assert
    expect(lines).toEqual([
      { headline: "All systems nominal", detail: "17 modules · every monitored reading in limits" },
      { headline: "1 active alarm", detail: "17 modules" },
      { headline: "2 active warnings", detail: "1 module" },
    ]);
  });
});
