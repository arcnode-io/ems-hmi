/**
 * Mock data for Compute screen. Replaced once per-server measurements
 * land in the topology + a historian backs draw-cap utilization windows.
 * Mirrors design-handoff/03-screens/compute-detail-screen.jsx fixture.
 */

/** 32 servers · per-server [utilPct, drawWatts]. */
function buildServers(): Array<{ id: string; util: number; draw: number }> {
  const rows: Array<{ id: string; util: number; draw: number }> = [];
  // Reason: deterministic but realistic-feeling spread — 4 rows of 8.
  const base = [92, 94, 91, 89, 95, 93, 92, 88, 90, 87, 91, 93, 96, 94, 89, 92, 88, 91, 86, 90, 0, 0, 4, 12, 85, 88, 87, 91, 72, 68, 71, 74];
  base.forEach((util, i) => {
    rows.push({
      id: `s${String(i + 1).padStart(2, "0")}`,
      util,
      draw: Math.round(util * 6 + (i % 7) * 4),
    });
  });
  return rows;
}

export const MOCK_COMPUTE = {
  cluster: {
    util: 77,
    drawKw: 184.2,
    headroomKw: 38.5,
    nodeCount: 32,
    capKw: 260,
  },
  servers: buildServers(),
  throttle: [
    { ts: "-12m", server: "s04", reason: "CDU outlet >38°C" },
    { ts: "-48m", server: "s14", reason: "Power cap approached" },
  ],
  alarms: [
    {
      severity: "warn" as const,
      device: "COMPUTE-S04",
      name: "CDU outlet rising",
      value: "38.4 °C",
      age: "17m ago",
      acknowledged: false,
    },
    {
      severity: "warn" as const,
      device: "COMPUTE-S14",
      name: "Power approaching cap",
      value: "942 / 1000 W",
      age: "1h 04m ago",
      acknowledged: true,
    },
  ],
};
