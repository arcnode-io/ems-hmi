/** Timing + magnitude constants for the mocked dispatch lifecycle. */

/** Delay between operator confirm and the BESS acking the setpoint. */
export const ACK_DELAY_MS = 1500;
/** Wall-clock length of the simulated dispatch window. */
export const SETTLE_WINDOW_MS = 90_000;
/** How long the SETTLED summary lingers before returning to resting. */
export const SETTLED_HOLD_MS = 4000;
/** SoC delta across a full dispatch window, percentage points. */
export const SOC_SWING_PCT = 30;
/** Demo time compression — 90 s of wall clock represents a 90 min interval. */
export const TIME_COMPRESSION = 60;
/** Sim-hours the window represents, for revenue accrual. */
export const SETTLE_WINDOW_HOURS =
  ((SETTLE_WINDOW_MS / 1000) * TIME_COMPRESSION) / 3600;
