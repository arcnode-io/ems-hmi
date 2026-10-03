/**
 * useGridModulesRoster — the Grid page's device roster.
 *
 * Per power-engineer (2026-09-13): der_dispatch and operating_envelope are
 * unparented site-level singletons in the real DTM, not children of
 * grid_module.contains — so the roster can't be built by walking
 * `device.parent`. Built from an explicit template-name allowlist instead,
 * each with one representative reading.
 *
 * pv_inverter landed 2026-09-14 (power-engineer) and follows
 * grid_module.contains like switchgear does, but real sites won't have an
 * instance registered until a separate per-site PV-count/sizing feature
 * lands — the demo fixture wires two instances so it's exercised here.
 * A transformer template, once it exists, would follow the same pattern.
 */

import { useMemo } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

export interface GridModuleRow {
  id: string;
  displayName: string;
  role: string;
  reading: { v: string; l: string };
}

type Reading = GridModuleRow["reading"];

/** Numeric reading formatted, or an enum label passed through under `label`. */
export type RosterSpec =
  | { role: string; measurement: string; format: (v: number) => Reading }
  | { role: string; measurement: string; label: string };

/** Per-template: which measurement to show, and how to format it. */
export const ROSTER_SPEC: Record<string, RosterSpec> = {
  grid_module: {
    role: "Site interconnect rollup",
    measurement: "net_active_power",
    format: (w) => ({ v: `${(w / 1000).toFixed(0)} kW`, l: "net" }),
  },
  operating_envelope: {
    role: "Utility operating envelope",
    measurement: "import_limit",
    format: (w) => ({ v: `${(w / 1_000_000).toFixed(2)} MW`, l: "import limit" }),
  },
  // Reason: not target_active_power — upstream it carries a reduction
  // magnitude, not a setpoint, until backend fixes it (2026-10-02).
  der_dispatch: {
    role: "Utility DER dispatch feed",
    measurement: "der_event_state",
    label: "event",
  },
  pv_inverter: {
    role: "PV string inverter",
    measurement: "active_power",
    format: (w) => ({ v: `${(w / 1_000_000).toFixed(2)} MW`, l: "output" }),
  },
};

/** One roster cell from a raw value; a value of the wrong kind reads as a dash. */
export function rosterReading(spec: RosterSpec, value: number | string | boolean | undefined): Reading {
  if ("label" in spec) {
    return typeof value === "string" ? { v: value, l: spec.label } : { v: "—", l: spec.measurement };
  }
  return typeof value === "number" ? spec.format(value) : { v: "—", l: spec.measurement };
}

/**
 * Build the Grid page's device roster from a fixed template-name allowlist.
 * @returns rows, one per matching device — empty until topology loads
 */
export function useGridModulesRoster(): GridModuleRow[] {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();

  const entries = useMemo(() => {
    if (!view) return [];
    return Object.entries(view.devices).filter(
      ([, device]) => device.template in ROSTER_SPEC,
    );
  }, [view]);

  const topics = useMemo(() => {
    if (!view) return [];
    const list: string[] = [];
    for (const [deviceId, device] of entries) {
      const tpl = view.templates_used[device.template];
      const spec = ROSTER_SPEC[device.template];
      if (!tpl || !spec) continue;
      const m = tpl.measurements[spec.measurement];
      if (m) list.push(measurementTopic(siteId, deviceId, spec.measurement, m.unit as TopicUnit));
    }
    return list;
  }, [view, entries, siteId]);

  const messages = useAggregateMeasurements<number | string | boolean>(topics);

  return useMemo(() => {
    if (!view) return [];
    return entries.map(([deviceId, device]) => {
      const spec = ROSTER_SPEC[device.template]!;
      const tpl = view.templates_used[device.template];
      const meas = tpl?.measurements[spec.measurement];
      const topic = meas
        ? measurementTopic(siteId, deviceId, spec.measurement, meas.unit as TopicUnit)
        : null;
      const reading = rosterReading(spec, topic ? messages[topic]?.value : undefined);
      return {
        id: deviceId,
        displayName: device.display_name ?? deviceId,
        role: spec.role,
        reading,
      };
    });
  }, [view, entries, siteId, messages]);
}
