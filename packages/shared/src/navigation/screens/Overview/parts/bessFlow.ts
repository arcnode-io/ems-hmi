/** BESS tile flow line: direction + magnitude from summed bess_module active_power. */

export interface BessFlow {
  label: "Discharging" | "Charging" | "Idle" | "—";
  value: string;
}

// Reason: racks idle-dither a few hundred W; don't flicker the label on noise.
const DEADBAND_W = 1000;

/** @example bessFlow(911_000) // { label: "Discharging", value: "911 kW" } */
export function bessFlow(powerW: number | null): BessFlow {
  if (powerW === null) return { label: "—", value: "—" };
  const label = powerW > DEADBAND_W ? "Discharging" : powerW < -DEADBAND_W ? "Charging" : "Idle";
  const kw = label === "Idle" ? 0 : Math.round(Math.abs(powerW) / 1000);
  return { label, value: `${kw} kW` };
}
