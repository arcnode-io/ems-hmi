/**
 * Topic-builder helpers for the MQTT contract per system_adr §9.
 *
 * Topic shapes are fixed across deployments:
 *   sites/{site_id}/devices/{device_id}/measurements/{measurement}/{unit}
 *   sites/{site_id}/devices/{device_id}/commands/{verb}/{target}/{unit}
 *   system/{event_type}
 *
 * Unit slot uses the operator-readable vocabulary per system_adr §10. Unitless
 * measurements pass `"none"` literally. Slug validation (`^[a-z][a-z0-9_]*$`)
 * lives at the schema boundary in ems-device-api; this builder trusts inputs.
 */

/** Operator-readable units in topic slot per system_adr §10. */
export type TopicUnit =
  | "volts"
  | "amps"
  | "watts"
  | "vars"
  | "voltamperes"
  | "watt_hours"
  | "hertz"
  | "celsius"
  | "percent"
  | "watts_per_m2"
  | "meters_per_second"
  | "bar"
  | "liters_per_minute"
  | "none";

/** Command verbs per system_adr §9. */
export type CommandVerb =
  | "set"
  | "reset"
  | "clear"
  | "start"
  | "stop"
  | "enable"
  | "disable";

/**
 * Build a measurement topic for a device.
 * @param siteId snake_case site slug
 * @param deviceId snake_case device slug (leaf id, depth via DTM parent chain)
 * @param measurement Canonical measurement name from the template
 * @param unit Unit vocabulary item
 * @returns Six-segment topic string
 * @example measurementTopic("arc01","bess_rack_1","state_of_charge","percent")
 *   // "sites/arc01/devices/bess_rack_1/measurements/state_of_charge/percent"
 */
export function measurementTopic(
  siteId: string,
  deviceId: string,
  measurement: string,
  unit: TopicUnit,
): string {
  return `sites/${siteId}/devices/${deviceId}/measurements/${measurement}/${unit}`;
}

/**
 * Build a command topic for a device.
 * @param siteId snake_case site slug
 * @param deviceId snake_case device slug
 * @param verb Command verb
 * @param target Target measurement / param name
 * @param unit Unit vocabulary item
 * @returns Seven-segment topic string
 */
export function commandTopic(
  siteId: string,
  deviceId: string,
  verb: CommandVerb,
  target: string,
  unit: TopicUnit,
): string {
  return `sites/${siteId}/devices/${deviceId}/commands/${verb}/${target}/${unit}`;
}

/**
 * Build the system topic for a broker-internal event type.
 * @param eventType Event slug, e.g. "topology_changed"
 * @returns Two-segment topic string
 */
export function systemTopic(eventType: string): string {
  return `system/${eventType}`;
}

/**
 * Parse a measurement topic back into its constituent parts. Returns `null`
 * on shape mismatch — useful for routing inbound messages by topic.
 * @param topic Inbound topic string
 * @returns Parsed parts or null
 */
export function parseMeasurementTopic(topic: string): {
  siteId: string;
  deviceId: string;
  measurement: string;
  unit: string;
} | null {
  const parts = topic.split("/");
  // 7 segments: sites / {site} / devices / {device} / measurements / {meas} / {unit}
  if (parts.length !== 7) return null;
  if (
    parts[0] !== "sites" ||
    parts[2] !== "devices" ||
    parts[4] !== "measurements"
  ) {
    return null;
  }
  return {
    siteId: parts[1]!,
    deviceId: parts[3]!,
    measurement: parts[5]!,
    unit: parts[6]!,
  };
}
