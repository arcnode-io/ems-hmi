/**
 * useBessModuleDetail — module-level aggregate data for the BESS detail
 * view (a `bess_module` device: state_of_charge, active_power,
 * import_headroom, export_headroom — the same 4 real fields useModuleRows
 * already surfaces on the Modules list, resubscribed here at full
 * precision for the detail hero).
 *
 * Per-rack detail (voltage, frequency, operating state, energy
 * discharged) lives in useBessRackRoster — bess_rack is a real, separate
 * leaf template (Tesla Megapack), not something this module-level
 * rollup exposes.
 */

import { useMemo } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

export interface BessModuleDetail {
  socPercent: number | null;
  activePowerW: number | null;
  importHeadroomW: number | null;
  exportHeadroomW: number | null;
}

const MEASUREMENTS = [
  "state_of_charge",
  "active_power",
  "import_headroom",
  "export_headroom",
] as const;

/**
 * Subscribe to a bess_module device's own aggregate measurements.
 * @param deviceId the bess_module device id
 * @returns BessModuleDetail — null fields until the first tick lands
 */
export function useBessModuleDetail(deviceId: string): BessModuleDetail {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();
  const tpl = view?.templates_used["bess_module"];

  const topics = useMemo(() => {
    if (!tpl) return [];
    const list: string[] = [];
    for (const name of MEASUREMENTS) {
      const m = tpl.measurements[name];
      if (m) list.push(measurementTopic(siteId, deviceId, name, m.unit as TopicUnit));
    }
    return list;
  }, [tpl, siteId, deviceId]);

  const messages = useAggregateMeasurements<number>(topics);

  return useMemo(() => {
    let socPercent: number | null = null;
    let activePowerW: number | null = null;
    let importHeadroomW: number | null = null;
    let exportHeadroomW: number | null = null;

    for (const topic of topics) {
      const msg = messages[topic];
      if (!msg || typeof msg.value !== "number") continue;
      if (topic.endsWith("/state_of_charge/percent")) socPercent = msg.value;
      else if (topic.endsWith("/active_power/watts")) activePowerW = msg.value;
      else if (topic.endsWith("/import_headroom/watts")) importHeadroomW = msg.value;
      else if (topic.endsWith("/export_headroom/watts")) exportHeadroomW = msg.value;
    }

    return { socPercent, activePowerW, importHeadroomW, exportHeadroomW };
  }, [topics, messages]);
}
