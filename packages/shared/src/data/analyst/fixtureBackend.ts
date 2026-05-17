/**
 * Local fixture backend — stands in for the analyst-agent until its HTTP
 * surface is reachable. Pattern-matches the user message to one of a few
 * canned responses so the HMI Analyst screen has something to render
 * during development.
 *
 * Swap for a real `fetch("/analyst/chat", ...)` call when the agent
 * is live; the shape is identical.
 */

import type {
  AnalystChatRequest,
  AnalystMessage,
  LineSpec,
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

interface FixturePattern {
  match: RegExp;
  reply: () => AnalystMessage;
}

const PATTERNS: FixturePattern[] = [
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

/**
 * Pretend to call the analyst backend; returns a canned response based on
 * a simple regex match against the user's message. Swap for HTTP when
 * the real agent is reachable.
 *
 * @param req chat request (conversationId + message + context)
 * @returns assistant message
 */
export async function fixtureChat(req: AnalystChatRequest): Promise<AnalystMessage> {
  // Reason: simulate ~300ms backend round-trip so the chat UI exercises
  // its loading state.
  await new Promise((resolve) => setTimeout(resolve, 300));
  const matched = PATTERNS.find((p) => p.match.test(req.message));
  return matched ? matched.reply() : fallbackReply(req.message);
}
