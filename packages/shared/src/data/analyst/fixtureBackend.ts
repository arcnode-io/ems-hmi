/**
 * Local fixture backend — canned analyst replies for tests + offline dev.
 * mockAnalystStream wraps it to stand in for the live SSE stream.
 */

import type {
  AnalystChatRequest,
  AnalystMessage,
  BarSpec,
  LineSpec,
  PieSpec,
  TableSpec,
} from "./types";

function nowIso(): string {
  return new Date().toISOString();
}

function bessSocLine(): LineSpec {
  // 24 points over 24 hours, walking from 80 → 62 with mild noise.
  const points = Array.from({ length: 24 }, (_, i) => ({
    x: i,
    y: 80 - i * 0.75 + Math.sin(i / 3) * 1.5,
  }));
  return {
    title: "BESS-01 State of Charge — last 24h",
    xAxis: { label: "hours ago", kind: "numeric" },
    yAxis: { label: "SoC", unit: "%" },
    series: [{ label: "BESS-01", points, style: "solid" }],
    thresholds: [
      { label: "MIN", y: 20, severity: "alarm" },
      { label: "WARN", y: 30, severity: "warn" },
    ],
    dataAsOf: nowIso(),
  };
}

function alarmsTable(): TableSpec {
  return {
    title: "Active alarms — last hour",
    columns: [
      { key: "device", label: "Device", align: "left" },
      { key: "name", label: "Alarm", align: "left" },
      { key: "value", label: "Value", align: "right" },
      { key: "age", label: "Age", align: "right" },
    ],
    rows: [
      { device: "BESS-02", name: "Cell voltage spread", value: "0.142 V", age: "4m" },
      { device: "COMPUTE-S04", name: "CDU outlet rising", value: "38.4 °C", age: "17m" },
    ],
    rowSeverity: ["alarm", "warn"],
    dataAsOf: nowIso(),
  };
}

function marketsBar(): BarSpec {
  return {
    title: "PLACEHOLDER: today's revenue by market",
    xAxis: { label: "market", categories: ["DAM", "RTM", "FREQ"] },
    yAxis: { label: "revenue", unit: "$" },
    series: [{ label: "today", values: [1840, 720, 320] }],
    dataAsOf: nowIso(),
  };
}

function energyBreakdownPie(): PieSpec {
  return {
    title: "PLACEHOLDER: today's energy by source",
    unit: "MWh",
    slices: [
      { label: "Grid import", value: 14.2 },
      { label: "BESS discharge", value: 6.4 },
      { label: "On-site solar", value: 2.1 },
    ],
    dataAsOf: nowIso(),
  };
}

interface FixturePattern {
  match: RegExp;
  reply: () => AnalystMessage;
}

const PATTERNS: FixturePattern[] = [
  {
    match: /market|revenue|dam|rtm|freq/i,
    reply: (): AnalystMessage => ({
      role: "assistant",
      timestamp: nowIso(),
      content: [
        { type: "text", text: "Today's revenue split (PLACEHOLDER until the markets pipeline lands)." },
        { type: "artifact", artifact: { kind: "bar", spec: marketsBar() } },
      ],
    }),
  },
  {
    match: /breakdown|by source|energy mix/i,
    reply: (): AnalystMessage => ({
      role: "assistant",
      timestamp: nowIso(),
      content: [
        { type: "text", text: "Today's energy consumption by source (PLACEHOLDER until the per-meter pipeline lands)." },
        { type: "artifact", artifact: { kind: "pie", spec: energyBreakdownPie() } },
      ],
    }),
  },
  {
    match: /soc|state of charge|bess.*chart/i,
    reply: (): AnalystMessage => ({
      role: "assistant",
      timestamp: nowIso(),
      content: [
        {
          type: "text",
          text: "BESS-01 drifted from 80% to ~62% overnight — typical for an arbitrage-discharge profile. WARN threshold at 30%.",
        },
        { type: "artifact", artifact: { kind: "line", spec: bessSocLine() } },
      ],
      toolTrace: [
        { tool: "queryTimeseries", args: { device_id: "bess_01", measurement: "state_of_charge", window: "P1D" }, outcome: "ok", ms: 142 },
      ],
    }),
  },
  {
    match: /alarm|warn|incident/i,
    reply: (): AnalystMessage => ({
      role: "assistant",
      timestamp: nowIso(),
      content: [
        {
          type: "text",
          text: "Two active alarms in the last hour — one cell spread on BESS-02 (alarm), one rising CDU outlet on COMPUTE-S04 (warn).",
        },
        { type: "artifact", artifact: { kind: "table", spec: alarmsTable() } },
      ],
      toolTrace: [
        { tool: "listDevicesWhere", args: { status: ["alarm", "warn"] }, outcome: "ok", ms: 87 },
      ],
    }),
  },
];

function fallbackReply(message: string): AnalystMessage {
  return {
    role: "assistant",
    timestamp: nowIso(),
    content: [
      {
        type: "text",
        text: `Local fixture: I can't answer "${message.slice(0, 60)}…" yet — try asking about BESS SoC or active alarms. Swap this hook for the real analyst-agent HTTP backend when it's live.`,
      },
    ],
  };
}

const FAKE_LATENCY_MS = 300;

/** Match the user message against a regex table and return a canned reply. */
export async function fixtureChat(req: AnalystChatRequest): Promise<AnalystMessage> {
  await new Promise((resolve) => setTimeout(resolve, FAKE_LATENCY_MS));
  const matched = PATTERNS.find((p) => p.match.test(req.message));
  return matched ? matched.reply() : fallbackReply(req.message);
}
