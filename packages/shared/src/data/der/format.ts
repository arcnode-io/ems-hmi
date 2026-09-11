/** Display formatters for Grid Events values. */

/** Watts to "1.2 MW" / "820 kW" — no sign, no direction word. */
function fmtMagnitude(watts: number): string {
  const abs = Math.abs(watts);
  return abs >= 1_000_000
    ? `${(abs / 1_000_000).toFixed(1)} MW`
    : `${(abs / 1000).toFixed(0)} kW`;
}

/** Signed power with a direction word, e.g. "1.2 MW absorb" / "820 kW export". */
export function formatDerTarget(watts: number): string {
  if (watts === 0) return "0 kW";
  return `${fmtMagnitude(watts)} ${watts < 0 ? "absorb" : "export"}`;
}

/** Export ceiling magnitude, e.g. "300 kW". */
export function formatExportCap(watts: number): string {
  return fmtMagnitude(watts);
}

/** Whether the actual reading is close enough to the commanded target to call it "tracking". */
const TRACKING_TOLERANCE_W = 150_000;
export function isTrackingCommand(
  commandedW: number,
  actualW: number | null,
): boolean {
  if (actualW === null) return false;
  return Math.abs(actualW - commandedW) <= TRACKING_TOLERANCE_W;
}
