/**
 * Test fixture for the stale-reading policy: one device with a 1 Hz reading
 * (`power`, expires after 3 s of silence) and an on-change one (`state`,
 * `poll_rate_hz: null` — never expires). Import explicitly into tests.
 */

import type { TopologyViewType } from "../topology/topology.schema";

export const PERIODIC_TOPIC = "sites/s/devices/d1/measurements/power/watts";
export const ON_CHANGE_TOPIC = "sites/s/devices/d1/measurements/state/none";

function measurement(pollRateHz: number | null): object {
  return { unit: "watts", type: "float", poll_rate_hz: pollRateHz, display_name_default: null, iec_61850_ref: null, bounds: null, thresholds: null, values: null };
}

export const STALE_TEST_VIEW = {
  devices: { d1: { device_id: "d1", template: "t", parent: null, display_name: null, extra_measurements: null } },
  buses: [],
  templates_used: { t: { measurements: { power: measurement(1), state: { ...measurement(null), unit: "none" } } } },
} as unknown as TopologyViewType;
