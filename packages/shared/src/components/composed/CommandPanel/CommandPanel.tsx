/**
 * CommandPanel — operator dispatch control for a BESS module. Shows the
 * autopilot's standing proposal, lets the operator adjust the signed power
 * setpoint, and routes every dispatch through ConfirmationModal (Rule 3.1).
 *
 * Interactive controls are desktop-only — dispatch happens at the desk
 * console; phones are read-only (constitution Rule 3.1). While a dispatch
 * runs, the controls give way to a live status card. Controls start locked
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
import { useAutopilotProposal } from "../../../data/dispatch/useAutopilotProposal";
import { useDerEventActive } from "../../../data/grid/useDerEventActive";
import { formatSetpoint } from "../../../data/dispatch/format";
import { useAskAnalyst } from "../../../data/analyst/useAskAnalyst";
import { ConfirmationModal } from "../ConfirmationModal/ConfirmationModal";
import { DecisionRecord } from "../DecisionRecord/DecisionRecord";
import { useWriteUnlock } from "../../../hooks/useWriteUnlock";
import { useLoto } from "../../../data/loto/useLoto";
import { SetpointStepper, DispatchStatusCard } from "./CommandPanel.parts";
import { AutopilotToggle } from "./AutopilotToggle";
import { UnlockControls } from "./UnlockControls";
import { DerEventLockout } from "./DerEventLockout";
import { ApplyButton } from "./ApplyButton";

export interface CommandPanelProps {
  deviceId: string;
  deviceDisplayName: string;
}

/** Fallback SoC if no measurement has arrived yet, percent. */
const NOMINAL_SOC = 60;

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
  const askAnalyst = useAskAnalyst();
  // ADR-002 §16: der-control-api owns every bess_module setpoint while a DER
  // event is active. Economic dispatch (manual or autopilot) holds off.
  const derEventActive = useDerEventActive();

  // The autopilot's standing action follows the live SoC (discharge high,
  // charge low). `override` is the operator's manual setpoint, or null to
  // track autopilot; it's cleared each time a new dispatch starts.
  const auto = useAutopilotProposal(deviceId);
  const [override, setOverride] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const setpointKw = override ?? auto.setpointKw;
  // Reason: a LOTO'd device takes no writes (gateway refuses them); don't offer to unlock.
  const lotoLocked = useLoto().lockedDevices.has(deviceId);
  const guard = useWriteUnlock(useIsFocused() && !lotoLocked);
  const locked = !guard.unlocked;

  // Reason: a relock mid-confirmation must not leave a live Confirm on screen.
  useEffect(() => {
    if (locked) setModalOpen(false);
  }, [locked]);

  useEffect(() => {
    if (state.phase !== "proposed") setOverride(null);
  }, [state.phase]);

  const socTopic = measurementTopic(
    identity.siteId,
    deviceId,
    "state_of_charge",
    "percent",
  );
  const socMsg = useSubscription<number>(socTopic);
  const socPct = typeof socMsg?.value === "number" ? socMsg.value : NOMINAL_SOC;

  const resting = state.phase === "proposed";
  const reason = override === null ? auto.reason : "Operator override";
  // Show the active dispatch while one runs; the standing proposal while resting.
  const shown = state.proposal ?? auto;

  const onConfirm = (): void => {
    confirm(
      { deviceId, setpointKw, priceUsdPerMwh: auto.priceUsdPerMwh, reason },
      socPct,
    );
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
        {isDesktop ? <AutopilotToggle disabled={locked} onToggle={guard.noteWrite} /> : null}

        {/* Active dispatch while one runs; the standing proposal while resting. */}
        <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textMid }]}>
          <Text style={{ color: t.colorBess, fontWeight: "700" }}>AUTO </Text>
          {formatSetpoint(shown.setpointKw)} — {shown.reason}
        </Text>

        <DecisionRecord
          deviceId={deviceId}
          onAskAnalyst={() => askAnalyst(deviceId)}
        />

        {resting ? (
          derEventActive ? (
            <DerEventLockout />
          ) : isDesktop ? (
            <>
              <SetpointStepper valueKw={setpointKw} onChange={setOverride} disabled={locked} />
              <ApplyButton disabled={locked || setpointKw === 0} onPress={() => setModalOpen(true)} />
            </>
          ) : (
            <Text
              style={[
                resolveTypeStyle(t, "caption"),
                { color: t.textSoft, fontSize: 10 },
              ]}
            >
              Dispatch from the desk console.
            </Text>
          )
        ) : (
          <DispatchStatusCard />
        )}
      </View>

      <ConfirmationModal
        visible={modalOpen}
        commandSummary={formatSetpoint(setpointKw)}
        targetDevices={[
          {
            id: deviceId,
            name: deviceDisplayName,
            currentState: `SoC ${socPct.toFixed(0)}%`,
          },
        ]}
        simMode={simMode}
        onConfirm={onConfirm}
        onCancel={() => setModalOpen(false)}
      />
    </View>
  );
}
