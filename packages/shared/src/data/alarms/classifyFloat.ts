/**
 * classifyFloat — a reading against its template's limit envelope: which
 * band it's in and which limit it crossed.
 */

export type AlarmSeverity = "warn" | "alarm";

export interface ThresholdEnvelope {
  warn_min: number;
  warn_max: number;
  alarm_min: number;
  alarm_max: number;
}

/** The limit a reading crossed — "min" = it fell below `value`. */
export interface BrokenLimit {
  side: "min" | "max";
  value: number;
}

export interface FloatVerdict {
  severity: AlarmSeverity;
  limit: BrokenLimit;
}

/**
 * @returns the band and crossed limit, or null when within the warn band
 * @example classifyFloat(240, { warn_min: 394, warn_max: 436, alarm_min: 381, alarm_max: 439 }) // { severity: "alarm", limit: { side: "min", value: 381 } }
 */
export function classifyFloat(value: number, th: ThresholdEnvelope): FloatVerdict | null {
  if (value < th.alarm_min) return { severity: "alarm", limit: { side: "min", value: th.alarm_min } };
  if (value > th.alarm_max) return { severity: "alarm", limit: { side: "max", value: th.alarm_max } };
  if (value < th.warn_min) return { severity: "warn", limit: { side: "min", value: th.warn_min } };
  if (value > th.warn_max) return { severity: "warn", limit: { side: "max", value: th.warn_max } };
  return null;
}
