/**
 * useRealDispatch — the DispatchContext value for real-broker mode. confirm()
 * publishes a command frame ({ ts, value, command_id }) and subscribes to the
 * device's dispatch_state events; the gateway's received/done/failed drives the
 * lifecycle (no client-side simulation). One command in flight per provider.
 */

import { useCallback, useRef, useState } from "react";
import type { MqttClient, Unsubscribe } from "./MqttClient";
import { commandTopic, dispatchStateTopic } from "../topics/topicBuilder";
import { correlationId } from "./correlationId";
import { parseDispatchEvent, applyDispatchEvent } from "./dispatchEvents";
import type { DispatchControls } from "../dispatch/DispatchContext";
import type { DispatchProposal, DispatchState } from "../dispatch/dispatch.types";

const RESTING: DispatchState = {
  phase: "proposed",
  proposal: null,
  executingStartedAt: null,
  executingEndsAt: null,
  reason: null,
};

/** Publish a raw command frame (carries command_id, so not an MqttMessage). */
export type PublishFrame = (topic: string, frame: Record<string, string | number>) => void;

export function useRealDispatch(
  client: MqttClient | null,
  publishFrame: PublishFrame,
  siteId: string,
): DispatchControls {
  const [state, setState] = useState<DispatchState>(RESTING);
  const activeCmd = useRef<string | null>(null);
  const offEvents = useRef<Unsubscribe | null>(null);

  const teardown = useCallback((): void => {
    offEvents.current?.();
    offEvents.current = null;
    activeCmd.current = null;
  }, []);

  // socStartPct (2nd DispatchControls arg) is unused in real mode — TS allows
  // an impl with fewer params.
  const confirm = useCallback(
    (proposal: DispatchProposal): void => {
      if (!client) return;
      teardown();
      const cmdId = correlationId();
      activeCmd.current = cmdId;
      publishFrame(
        commandTopic(siteId, proposal.deviceId, "set", "active_power", "watts"),
        { ts: new Date().toISOString(), value: proposal.setpointKw * 1000, command_id: cmdId },
      );
      offEvents.current = client.subscribe(
        dispatchStateTopic(siteId, proposal.deviceId),
        (msg) => {
          const event = parseDispatchEvent(msg);
          if (!event) return;
          const transition = applyDispatchEvent(event, activeCmd.current);
          if (!transition) return;
          setState((s) => ({ ...s, phase: transition.phase, reason: transition.reason }));
          if (transition.phase === "settled" || transition.phase === "failed") teardown();
        },
      );
      setState({ ...RESTING, phase: "pending", proposal });
    },
    [client, publishFrame, siteId, teardown],
  );

  const cancel = useCallback((): void => {
    teardown();
    setState(RESTING);
  }, [teardown]);

  return { state, confirm, cancel };
}
