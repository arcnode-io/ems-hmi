/**
 * CommandPanel — operator dispatch control for a BESS module. The operator
 * sets a signed power setpoint within the catalog's rated range and routes
 * every dispatch through ConfirmationModal (Rule 3.1). No rating in the
 * catalog → no dispatch offered (the HMI never invents a limit).
 *
 * Interactive controls are desktop-only — dispatch happens at the desk
 * console; phones are read-only (constitution Rule 3.1). While a dispatch
 * is in flight, the controls give way to its status; the last result stays
 * shown above the controls. Controls start locked
 * behind "Unlock controls" (useWriteUnlock) — accidental-write guard only.
 *
 * See design-handoff/02-components/CommandPanel.md.
 */

import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { useTopologyView } from "../../../data/topology/useTopologyView";
import { useDeploymentIdentity } from "../../../data/deployment/useDeploymentIdentity";
import { useSubscription } from "../../../data/mqtt/useSubscription";
import { measurementTopic } from "../../../data/topics/topicBuilder";
import { useDispatch } from "../../../data/dispatch/useDispatch";
import { setpointRangeKw } from "../../../data/dispatch/setpointRange";
import { useDerEventActive } from "../../../data/grid/useDerEventActive";
import { formatSetpoint } from "../../../data/dispatch/format";
import { ConfirmationModal } from "../ConfirmationModal/ConfirmationModal";
import { useWriteUnlock } from "../../../hooks/useWriteUnlock";
import { useLoto } from "../../../data/loto/useLoto";
import { SetpointStepper, DispatchStatusCard } from "./CommandPanel.parts";
import { UnlockControls } from "./UnlockControls";
import { DerEventLockout } from "./DerEventLockout";
import { ApplyButton } from "./ApplyButton";

export interface CommandPanelProps {
  deviceId: string;
  deviceDisplayName: string;
}

export function CommandPanel({
  deviceId,
  deviceDisplayName,
}: CommandPanelProps): React.ReactElement {
  const t = useTheme();
  const isDesktop = useBreakpoint().layout === "desktop";
  const identity = useDeploymentIdentity();
  const { view } = useTopologyView();
  const simMode = view?.ems_mode === "sim";
  const { state, confirm } = useDispatch();
  // ADR-002 §16: der-control-api owns every bess_module setpoint while a DER
  // event is active. Operator dispatch holds off.
  const derEventActive = useDerEventActive();
  const range = view ? setpointRangeKw(view, deviceId) : null;
  const [setpointKw, setSetpointKw] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  // Reason: a LOTO'd device takes no writes (gateway refuses them); don't offer to unlock.
  const lotoLocked = useLoto().lockedDevices.has(deviceId);
  const guard = useWriteUnlock(useIsFocused() && !lotoLocked);
  const locked = !guard.unlocked;

  // Reason: a relock mid-confirmation must not leave a live Confirm on screen.
  useEffect(() => {
    if (locked) setModalOpen(false);
  }, [locked]);

  const socTopic = measurementTopic(identity.siteId, deviceId, "state_of_charge", "percent");
  const socMsg = useSubscription<number>(socTopic);
  const socPct = typeof socMsg?.value === "number" ? `${socMsg.value.toFixed(0)}%` : "—";
  const inFlight = state.phase === "pending";

  const onConfirm = (): void => {
    confirm({ deviceId, setpointKw });
    guard.noteWrite();
    setModalOpen(false);
  };

  return (
    <View
      dataSet={{ comp: "CommandPanel" }}
      style={{
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        overflow: "hidden",
      }}
    >
      <View
        style={{
          paddingVertical: SPACE[2],
          paddingHorizontal: SPACE[3],
          borderBottomWidth: 1,
          borderBottomColor: t.borderSoft,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "cardHeading"),
            { color: t.text, fontSize: 13 },
          ]}
        >
          Dispatch Control
        </Text>
        {isDesktop ? <UnlockControls unlocked={guard.unlocked} onUnlock={guard.unlock} lockedOut={lotoLocked} /> : null}
      </View>

      <View style={{ padding: SPACE[3], gap: SPACE[3] }}>
        {state.phase !== "idle" && state.command?.deviceId === deviceId ? <DispatchStatusCard /> : null}

        {inFlight ? null : derEventActive ? (
          <DerEventLockout />
        ) : !range ? (
          <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft, fontSize: 10 }]}>
            No rated power in the catalog for this BESS — dispatch unavailable.
          </Text>
        ) : isDesktop ? (
          <>
            <SetpointStepper valueKw={setpointKw} range={range} onChange={setSetpointKw} disabled={locked} />
            <ApplyButton disabled={locked || setpointKw === 0} onPress={() => setModalOpen(true)} />
          </>
        ) : (
          <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft, fontSize: 10 }]}>
            Dispatch from the desk console.
          </Text>
        )}
      </View>

      <ConfirmationModal
        visible={modalOpen}
        commandSummary={formatSetpoint(setpointKw)}
        targetDevices={[
          {
            id: deviceId,
            name: deviceDisplayName,
            currentState: `SoC ${socPct}`,
          },
        ]}
        simMode={simMode}
        onConfirm={onConfirm}
        onCancel={() => setModalOpen(false)}
      />
    </View>
  );
}
