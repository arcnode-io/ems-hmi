/** Display formatters for dispatch values. */

/** Human-readable setpoint, e.g. "Discharge 1620 kW" / "Charge 300 kW" / "Idle". */
export function formatSetpoint(setpointKw: number): string {
  if (setpointKw === 0) return "Idle";
  const verb = setpointKw > 0 ? "Discharge" : "Charge";
  return `${verb} ${Math.abs(setpointKw)} kW`;
}
