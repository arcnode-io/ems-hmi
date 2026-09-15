/**
 * useDerEventActive — site-wide "is a DER curtailment event active" flag.
 *
 * Per ADR-002 §16 (Joe, 2026-09-15): while a DER event is active,
 * der-control-api owns every bess_module's commands/set/active_power/watts
 * setpoint — the HMI's economic dispatch (operator-confirmed or autopilot)
 * must hold off and show the operator why, checking this same retained
 * der_dispatch.event_active flag it already reads for the Grid screen.
 * Outside an event, the HMI owns dispatch as before.
 *
 * Device id is resolved from topology (template match), not hardcoded —
 * der_dispatch is a site singleton but its id shouldn't be assumed.
 */

import { useMemo } from "react";
import { useTopologyView } from "../topology/useTopologyView";
import { useSubscription } from "../mqtt/useSubscription";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { measurementTopic, type TopicUnit } from "../topics/topicBuilder";

/**
 * @returns true while a DER event is active; false when inactive or unknown
 */
export function useDerEventActive(): boolean {
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();

  const topic = useMemo(() => {
    if (!view) return null;
    const entry = Object.entries(view.devices).find(
      ([, d]) => d.template === "der_dispatch",
    );
    if (!entry) return null;
    const [deviceId] = entry;
    const m = view.templates_used["der_dispatch"]?.measurements["event_active"];
    if (!m) return null;
    return measurementTopic(siteId, deviceId, "event_active", m.unit as TopicUnit);
  }, [view, siteId]);

  const msg = useSubscription<boolean>(topic ?? "");
  return topic !== null && msg?.value === true;
}
