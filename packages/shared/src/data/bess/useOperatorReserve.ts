/**
 * useOperatorReserve — the operator's battery reserve (MWh) and a setter.
 * State is retained on the broker and republished on reconnect; absent = 0.
 */

import { useCallback, useContext, useMemo } from "react";
import { MqttClientContext } from "../mqtt/MqttProvider";
import { useSubscription } from "../mqtt/useSubscription";
import { useTopologyView } from "../topology/useTopologyView";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { operatorReserveTopics, parseReserveWh } from "./operatorReserve";

const WH_PER_MWH = 1_000_000;

export interface OperatorReserve {
  reserveMwh: number;
  /** Null when there's no broker or the site's template has no operator_reserve. */
  setReserveMwh: ((mwh: number) => void) | null;
}

export function useOperatorReserve(): OperatorReserve {
  const client = useContext(MqttClientContext);
  const { view } = useTopologyView();
  const { siteId } = useDeploymentIdentity();
  const topics = useMemo(() => (view ? operatorReserveTopics(view, siteId) : null), [view, siteId]);
  const msg = useSubscription<number>(topics?.state ?? null);
  const setReserveMwh = useCallback(
    (mwh: number): void => {
      if (client === null || topics === null) return;
      // Reason: Wh on the wire (symmetry with energy_discharged / kwh_delivered).
      client.publish(topics.command, { ts: new Date().toISOString(), value: Math.round(mwh * WH_PER_MWH) });
    },
    [client, topics],
  );
  return {
    reserveMwh: parseReserveWh(msg?.value) / WH_PER_MWH,
    setReserveMwh: client === null || topics === null ? null : setReserveMwh,
  };
}
