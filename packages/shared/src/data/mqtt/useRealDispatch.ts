/**
 * useRealDispatch — the DispatchContext value for every mode. confirm()
 * publishes a command frame ({ ts, value, command_id }) and subscribes to the
 * device's dispatch_state events; the gateway's received/done/failed drives the
 * lifecycle (in the demo, the mock gateway answers on the same topics). One
 * command in flight per provider.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { MqttClient, Unsubscribe } from "./MqttClient";
import { commandTopic, dispatchStateTopic } from "../topics/topicBuilder";
import { correlationId } from "./correlationId";
import { parseDispatchEvent, applyDispatchEvent } from "./dispatchEvents";
import type { DispatchControls } from "../dispatch/DispatchContext";
import type { DispatchCommand, DispatchState } from "../dispatch/dispatch.types";

const IDLE: DispatchState = { phase: "idle", command: null, reason: null };

/** Publish a raw command frame (carries command_id, so not an MqttMessage). */
export type PublishFrame = (
  topic: string,
  frame: Record<string, string | number>,
) => void;

export function useRealDispatch(
  client: MqttClient | null,
  publishFrame: PublishFrame,
  siteId: string,
): DispatchControls {
  const [state, setState] = useState<DispatchState>(IDLE);
  const activeCmd = useRef<string | null>(null);
  const offEvents = useRef<Unsubscribe | null>(null);

  const teardown = useCallback((): void => {
    offEvents.current?.();
    offEvents.current = null;
    activeCmd.current = null;
  }, []);

  const confirm = useCallback(
    (command: DispatchCommand): void => {
      if (!client) return;
      teardown();
      const cmdId = correlationId();
      activeCmd.current = cmdId;
      publishFrame(
        commandTopic(siteId, command.deviceId, "set", "active_power", "watts"),
        {
          ts: new Date().toISOString(),
          value: command.setpointKw * 1000,
          command_id: cmdId,
        },
      );
      offEvents.current = client.subscribe(
        dispatchStateTopic(siteId, command.deviceId),
        (msg) => {
          const event = parseDispatchEvent(msg);
          if (!event) return;
          const transition = applyDispatchEvent(event, activeCmd.current);
          if (!transition) return;
          setState((s) => ({
            ...s,
            phase: transition.phase,
            reason: transition.reason,
          }));
          if (transition.phase === "settled" || transition.phase === "failed")
            teardown();
        },
      );
      setState({ phase: "pending", command, reason: null });
    },
    [client, publishFrame, siteId, teardown],
  );

  // Reason: every subscription ends with its owner — an unmount mid-dispatch
  // (e.g. logout) must not leave the dispatch-state listener behind.
  useEffect(() => teardown, [teardown]);

  const cancel = useCallback((): void => {
    teardown();
    setState(IDLE);
  }, [teardown]);

  return { state, confirm, cancel };
}
