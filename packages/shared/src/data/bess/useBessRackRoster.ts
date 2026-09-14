/**
 * useBessRackRoster — per-rack telemetry for a bess_module's children.
 * Unlike the Grid page's roster, bess_rack devices ARE properly parented
 * to their bess_module in the real DTM (edp-api bess_module.yaml declares
 * `contains: [{template: bess_rack, qty: scalable}]`), so this walks
 * `device.parent` rather than needing an allowlist.
 */

import { useMemo } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useAggregateMeasurements } from "../mqtt/useAggregateMeasurements";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

export type RackOperatingState = "STANDBY" | "CHARGING" | "DISCHARGING" | "FAULT" | "OFFLINE";

export interface BessRackRow {
  id: string;
  displayName: string;
  socPercent: number | null;
  activePowerW: number | null;
  acVoltageV: number | null;
  frequencyHz: number | null;
  energyDischargedWh: number | null;
  operatingState: RackOperatingState | null;
}

const MEASUREMENTS = [
  "state_of_charge",
  "active_power",
  "ac_voltage",
  "frequency",
  "energy_discharged",
  "operating_state",
] as const;

const OPERATING_STATES: readonly RackOperatingState[] = [
  "STANDBY",
  "CHARGING",
  "DISCHARGING",
  "FAULT",
  "OFFLINE",
];

/**
 * Subscribe to the real bess_rack children of a bess_module device.
 * @param moduleDeviceId the parent bess_module device id
 * @returns one row per rack — empty until topology loads or no racks exist
 */
export function useBessRackRoster(moduleDeviceId: string): BessRackRow[] {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();

  const racks = useMemo(() => {
    if (!view) return [];
    return Object.entries(view.devices).filter(
      ([, d]) => d.template === "bess_rack" && d.parent === moduleDeviceId,
    );
  }, [view, moduleDeviceId]);

  const topics = useMemo(() => {
    if (!view) return [];
    const tpl = view.templates_used["bess_rack"];
    if (!tpl) return [];
    const list: string[] = [];
    for (const [deviceId] of racks) {
      for (const name of MEASUREMENTS) {
        const m = tpl.measurements[name];
        if (m) list.push(measurementTopic(siteId, deviceId, name, m.unit as TopicUnit));
      }
    }
    return list;
  }, [view, racks, siteId]);

  const messages = useAggregateMeasurements<number | string>(topics);

  return useMemo(() => {
    return racks.map(([deviceId, device]) => {
      let socPercent: number | null = null;
      let activePowerW: number | null = null;
      let acVoltageV: number | null = null;
      let frequencyHz: number | null = null;
      let energyDischargedWh: number | null = null;
      let operatingState: RackOperatingState | null = null;

      for (const name of MEASUREMENTS) {
        const tpl = view?.templates_used["bess_rack"];
        const m = tpl?.measurements[name];
        if (!m) continue;
        const topic = measurementTopic(siteId, deviceId, name, m.unit as TopicUnit);
        const msg = messages[topic];
        if (!msg) continue;
        if (name === "state_of_charge" && typeof msg.value === "number") socPercent = msg.value;
        else if (name === "active_power" && typeof msg.value === "number") activePowerW = msg.value;
        else if (name === "ac_voltage" && typeof msg.value === "number") acVoltageV = msg.value;
        else if (name === "frequency" && typeof msg.value === "number") frequencyHz = msg.value;
        else if (name === "energy_discharged" && typeof msg.value === "number") energyDischargedWh = msg.value;
        else if (name === "operating_state" && typeof msg.value === "string") {
          const match = OPERATING_STATES.find((s) => s === msg.value);
          if (match) operatingState = match;
        }
      }

      return {
        id: deviceId,
        displayName: device.display_name ?? deviceId,
        socPercent,
        activePowerW,
        acVoltageV,
        frequencyHz,
        energyDischargedWh,
        operatingState,
      };
    });
  }, [racks, view, siteId, messages]);
}
