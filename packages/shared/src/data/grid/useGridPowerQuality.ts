/**
 * useGridPowerQuality — Frequency/Voltage panel data for the Grid screen.
 * Frequency itself lives in useGridState (Interconnect panel); this hook
 * covers the rest of the handoff's FreqVoltPanel:
 *
 *   - `switchgear_*.bus_voltage_a/b/c` (averaged — the MV bus reading)
 *   - `switchgear_*.voltage_unbalance_pct`
 *   - `revenue_meter_*.thd_voltage_a/b/c` (averaged)
 *
 * LV bus has no home in the BOM today (confirmed with power-engineer
 * 2026-09-13: the transformer's secondary has no metering equipment
 * specced in any grid-container variant) — omitted, not faked.
 */

import { useMemo } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

export interface GridPowerQuality {
  /** Average of the three MV bus phase voltages, volts. */
  mvBusVoltageV: number | null;
  /** Voltage unbalance at the switchgear, percent. */
  voltageUnbalancePct: number | null;
  /** Average per-phase voltage THD at the revenue meter, percent. */
  thdVPercent: number | null;
}

function topicsFor(
  view: ReturnType<typeof useTopologyView>["view"],
  siteId: string,
  templateName: string,
  measurementNames: readonly string[],
): string[] {
  if (!view) return [];
  const list: string[] = [];
  for (const [deviceId, device] of Object.entries(view.devices)) {
    if (device.template !== templateName) continue;
    const tpl = view.templates_used[device.template];
    if (!tpl) continue;
    for (const name of measurementNames) {
      const m = tpl.measurements[name];
      if (m) list.push(measurementTopic(siteId, deviceId, name, m.unit as TopicUnit));
    }
  }
  return list;
}

function average(values: number[]): number | null {
  return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
}

/**
 * Subscribe to the Grid page's power-quality feeds.
 * @returns GridPowerQuality — null fields when the reading isn't in yet
 */
export function useGridPowerQuality(): GridPowerQuality {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();

  const topics = useMemo(() => {
    return [
      ...topicsFor(view, siteId, "switchgear", [
        "bus_voltage_a",
        "bus_voltage_b",
        "bus_voltage_c",
        "voltage_unbalance_pct",
      ]),
      ...topicsFor(view, siteId, "revenue_meter", [
        "thd_voltage_a",
        "thd_voltage_b",
        "thd_voltage_c",
      ]),
    ];
  }, [view, siteId]);

  const messages = useAggregateMeasurements<number>(topics);

  return useMemo(() => {
    const busVoltages: number[] = [];
    const thdPhases: number[] = [];
    let voltageUnbalancePct: number | null = null;

    for (const topic of topics) {
      const msg = messages[topic];
      if (!msg || typeof msg.value !== "number") continue;
      if (topic.includes("/bus_voltage_")) busVoltages.push(msg.value);
      else if (topic.endsWith("/voltage_unbalance_pct/percent")) voltageUnbalancePct = msg.value;
      else if (topic.includes("/thd_voltage_")) thdPhases.push(msg.value);
    }

    return {
      mvBusVoltageV: average(busVoltages),
      voltageUnbalancePct,
      thdVPercent: average(thdPhases),
    };
  }, [topics, messages]);
}
