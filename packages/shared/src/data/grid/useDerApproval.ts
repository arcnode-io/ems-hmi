/**
 * useDerApproval — operator approve/reject of a PENDING demand-response
 * dispatch (der_dispatch in MANUAL mode). Publishes over the operator's
 * authenticated broker session; der-control-api treats a doubled or stale
 * command as a no-op, so a double confirm is safe.
 */

import { useCallback, useContext } from "react";
import { MqttClientContext } from "../mqtt/MqttProvider";
import { useTopologyView } from "../topology/useTopologyView";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { derCommandTopic, type DerDecision } from "./derApproval";

/** Returns `decide`, or null when there's no broker / no der_dispatch device to command. */
export function useDerApproval(): ((decision: DerDecision) => void) | null {
  const client = useContext(MqttClientContext);
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();
  const decide = useCallback(
    (decision: DerDecision): void => {
      if (client === null || view === null) return;
      const topic = derCommandTopic(view.devices, siteId, decision);
      // Reason: bool payload per the der_dispatch template, in the system-wide
      // {ts, value} envelope.
      if (topic !== null) client.publish(topic, { ts: new Date().toISOString(), value: true });
    },
    [client, view, siteId],
  );
  return client === null || view === null || derCommandTopic(view.devices, siteId, "approve") === null
    ? null
    : decide;
}
