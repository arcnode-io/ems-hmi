/**
 * useGridModulesRoster — the Grid page's device roster.
 *
 * Per power-engineer (2026-09-13): operating_envelope, line_rating, and
 * der_dispatch are unparented site-level singletons in the real DTM, not
 * children of grid_module.contains — so the roster can't be built by
 * walking `device.parent`. Built from an explicit template-name allowlist
 * instead, each with one representative reading.
 *
 * PV inverters and a transformer, once they exist as templates, would
 * follow grid_module.contains like switchgear does — add them here once
 * they land rather than guessing a shape now.
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

/** Per-template: which measurement to show, and how to format it. */
const ROSTER_SPEC: Record<
  string,
  { role: string; measurement: string; format: (v: number) => { v: string; l: string } }
> = {
  grid_module: {
    role: "Site interconnect rollup",
    measurement: "net_active_power",
    format: (w) => ({ v: `${(w / 1000).toFixed(0)} kW`, l: "net" }),
  },
  operating_envelope: {
    role: "Utility DOE feed",
    measurement: "import_limit",
    format: (w) => ({ v: `${(w / 1_000_000).toFixed(1)} MW`, l: "import limit" }),
  },
  line_rating: {
    role: "Dynamic line rating feed",
    measurement: "dynamic_line_rating",
    format: (a) => ({ v: `${a.toFixed(0)} A`, l: "rating" }),
  },
  der_dispatch: {
    role: "Utility DER dispatch feed",
    measurement: "target_active_power",
    format: (w) => ({ v: `${(Math.abs(w) / 1_000_000).toFixed(2)} MW`, l: "target" }),
  },
};

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

  const messages = useAggregateMeasurements<number>(topics);

  return useMemo(() => {
    if (!view) return [];
    return entries.map(([deviceId, device]) => {
      const spec = ROSTER_SPEC[device.template]!;
      const tpl = view.templates_used[device.template];
      const meas = tpl?.measurements[spec.measurement];
      const topic = meas
        ? measurementTopic(siteId, deviceId, spec.measurement, meas.unit as TopicUnit)
        : null;
      const msg = topic ? messages[topic] : undefined;
      const reading =
        msg && typeof msg.value === "number" ? spec.format(msg.value) : { v: "—", l: spec.measurement };
      return {
        id: deviceId,
        displayName: device.display_name ?? deviceId,
        role: spec.role,
        reading,
      };
    });
  }, [view, entries, siteId, messages]);
}
