/** Display formatters for dispatch values. */

/** Human-readable setpoint, e.g. "Discharge 1620 kW" / "Charge 300 kW" / "Idle". */
export function formatSetpoint(setpointKw: number): string {
  if (setpointKw === 0) return "Idle";
  const verb = setpointKw > 0 ? "Discharge" : "Charge";
  return `${verb} ${Math.abs(setpointKw)} kW`;
}

/** Whole-dollar USD, e.g. "$421". */
export function formatUsd(usd: number): string {
  return `$${Math.round(usd)}`;
}

/** Countdown as "M:SS" from a seconds count. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = String(s % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}
