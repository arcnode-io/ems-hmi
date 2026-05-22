/**
 * Analyst chat types — mirror the analyst-agent backend's pydantic
 * `schemas.py` 1:1 (see [[project-analyst-architecture]]). Codegen swap
 * is one-line when the backend ships its OpenAPI surface.
 */

export interface LineSpecPoint {
  x: number | string;
  y: number | null;
}

export interface LineSpecSeries {
  label: string;
  color?: string;
  points: LineSpecPoint[];
  /** Forecast/projection series render dashed; historical render solid. */
  style?: "solid" | "dashed";
  /** v1.1 — reserved, always null in v1. */
  sourceTopic?: string | null;
}

export interface LineSpec {
  title: string;
  xAxis: { label: string; kind: "time" | "category" | "numeric" };
  yAxis: { label: string; unit: string };
  series: LineSpecSeries[];
  /** Null tolerated — the server serializes an absent optional as explicit null. */
  thresholds?: Array<{ label: string; y: number; severity: "warn" | "alarm" }> | null;
  /** Terse one-line insight, computed server-side. Rendered as the card's Insight footer. */
  note?: string | null;
  dataAsOf: string;
}

export interface BarSpec {
  title: string;
  xAxis: { label: string; categories: string[] };
  yAxis: { label: string; unit: string };
  series: Array<{ label: string; color?: string; values: number[] }>;
  stacked?: boolean;
  /** Terse one-line insight, computed server-side. Rendered as the card's Insight footer. */
  note?: string | null;
  dataAsOf: string;
}

export interface TableSpec {
  title: string;
  columns: Array<{ key: string; label: string; align?: "left" | "right"; unit?: string }>;
  rows: Array<Record<string, string | number | null>>;
  rowSeverity?: Array<"ok" | "warn" | "alarm" | undefined>;
  /** Terse one-line insight, computed server-side. Rendered as the card's Insight footer. */
  note?: string | null;
  dataAsOf: string;
}

export interface PieSpec {
  title: string;
  unit: string;
  slices: Array<{ label: string; value: number; color?: string }>;
  /** Terse one-line insight, computed server-side. Rendered as the card's Insight footer. */
  note?: string | null;
  dataAsOf: string;
}

export type ToolErrorCode =
  | "not_found"
  | "historian_down"
  | "invalid_input"
  | "rate_limited"
  | "site_id_changed"
  | "unknown";

/** Error-artifact payload — nested under `spec`, symmetric with the chart specs. */
export interface ToolErrorSpec {
  code: ToolErrorCode;
  message: string;
  dataAsOf: string;
}

export type AnalystArtifact =
  | { kind: "line"; spec: LineSpec }
  | { kind: "bar"; spec: BarSpec }
  | { kind: "table"; spec: TableSpec }
  | { kind: "pie"; spec: PieSpec }
  | { kind: "error"; spec: ToolErrorSpec };

export interface AnalystToolCall {
  tool: string;
  args: Record<string, unknown>;
  outcome: "ok" | "error";
  ms: number;
  /** Short human-readable step label, e.g. "Querying site historian". */
  label?: string | null;
  /** Trimmed result headline — populated for external tools (news/market/weather). */
  summary?: string | null;
}

export interface AnalystMessage {
  role: "user" | "assistant";
  content: Array<
    | { type: "text"; text: string }
    | { type: "artifact"; artifact: AnalystArtifact }
  >;
  toolTrace?: AnalystToolCall[];
  /**
   * ISO timestamp. The server doesn't emit one; the conversation provider
   * stamps it on send (user) / on receipt (assistant). Optional so a raw
   * server AnalystMessage validates before stamping.
   */
  timestamp?: string;
}

export interface AnalystChatRequest {
  conversationId: string;
  message: string;
  context?: {
    siteId?: string;
    focusedDeviceId?: string;
  };
}

/**
 * SSE stream events from `POST /analyst/chat` with `Accept: text/event-stream`.
 * The turn streams `tool_start`/`tool_end` as the agent works, then a single
 * `result` carrying the full AnalystMessage, then `done`.
 */
export type AnalystStreamEvent =
  | { kind: "tool_start"; seq: number; tool: string; label: string }
  | {
      kind: "tool_end";
      seq: number;
      tool: string;
      outcome: "ok" | "error";
      ms: number;
      summary?: string | null;
    }
  | { kind: "result"; message: AnalystMessage }
  | { kind: "done" };
