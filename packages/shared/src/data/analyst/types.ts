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
  dataAsOf: string;
}

export interface BarSpec {
  title: string;
  xAxis: { label: string; categories: string[] };
  yAxis: { label: string; unit: string };
  series: Array<{ label: string; color?: string; values: number[] }>;
  stacked?: boolean;
  dataAsOf: string;
}

export interface TableSpec {
  title: string;
  columns: Array<{ key: string; label: string; align?: "left" | "right"; unit?: string }>;
  rows: Array<Record<string, string | number | null>>;
  rowSeverity?: Array<"ok" | "warn" | "alarm" | undefined>;
  dataAsOf: string;
}

export interface PieSpec {
  title: string;
  unit: string;
  slices: Array<{ label: string; value: number; color?: string }>;
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
}

export interface AnalystMessage {
  role: "user" | "assistant";
  content: Array<
    | { type: "text"; text: string }
    | { type: "artifact"; artifact: AnalystArtifact }
  >;
  toolTrace?: AnalystToolCall[];
  /**
   * ISO timestamp. The server doesn't emit one; useAnalystChat assigns it
   * on send (user) / on receipt (assistant). Optional so a raw server
   * AnalystMessage validates before the hook stamps it.
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
