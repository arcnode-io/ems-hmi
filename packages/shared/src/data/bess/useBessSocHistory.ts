/**
 * useBessSocHistory — a session-scoped rolling buffer of a bess_module's
 * own state_of_charge samples, real values collected since this hook
 * mounted. Not a 24h history (no historical-telemetry source exists
 * anywhere in the app — same gap flagged for the Grid events log) — this
 * is real, live data with an honest "since you opened this page" label,
 * not a fabricated day-long trend.
 */

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { MqttClientContext } from "../mqtt/MqttProvider";
import { useTopologyView } from "../topology/useTopologyView";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

export interface SocSample {
  ts: number;
  value: number;
}

const MAX_SAMPLES = 120;

/**
 * Accumulate a rolling buffer of real state_of_charge samples for a
 * bess_module device.
 * @param deviceId the bess_module device id
 * @returns up to the last MAX_SAMPLES real samples, oldest first
 */
export function useBessSocHistory(deviceId: string): SocSample[] {
  const client = useContext(MqttClientContext);
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();
  const [samples, setSamples] = useState<SocSample[]>([]);
  const bufferRef = useRef<SocSample[]>([]);

  const topic = useMemo(() => {
    const m = view?.templates_used["bess_module"]?.measurements["state_of_charge"];
    if (!m) return null;
    return measurementTopic(siteId, deviceId, "state_of_charge", m.unit as TopicUnit);
  }, [view, siteId, deviceId]);

  useEffect(() => {
    bufferRef.current = [];
    setSamples([]);
    if (client === null || topic === null) return;
    const unsubscribe = client.subscribe<number>(topic, (msg) => {
      if (typeof msg.value !== "number") return;
      const next = [...bufferRef.current, { ts: Date.parse(msg.ts), value: msg.value }].slice(
        -MAX_SAMPLES,
      );
      bufferRef.current = next;
      setSamples(next);
    });
    return unsubscribe;
  }, [client, topic]);

  return samples;
}
