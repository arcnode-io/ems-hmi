/** Display formatters for DER-control values. */

/** Signed power with a direction word, e.g. "1.2 MW absorb" / "820 kW export". */
export function formatDerTarget(watts: number): string {
  if (watts === 0) return "0 kW";
  const abs = Math.abs(watts);
  const magnitude =
    abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)} MW` : `${(abs / 1000).toFixed(0)} kW`;
  return `${magnitude} ${watts < 0 ? "absorb" : "export"}`;
}

/** Whether the actual reading is close enough to the commanded target to call it "tracking". */
const TRACKING_TOLERANCE_W = 150_000;
export function isTrackingCommand(commandedW: number, actualW: number | null): boolean {
  if (actualW === null) return false;
  return Math.abs(actualW - commandedW) <= TRACKING_TOLERANCE_W;
}
