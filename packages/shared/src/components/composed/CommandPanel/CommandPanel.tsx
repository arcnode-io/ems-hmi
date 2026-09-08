/**
 * CommandPanel — operator dispatch control for a BESS module. Shows the
 * autopilot's standing proposal, lets the operator adjust the signed power
 * setpoint, and routes every dispatch through ConfirmationModal (Rule 3.1).
 *
 * Interactive controls are desktop-only — dispatch happens at the desk
 * console; phones are read-only (constitution Rule 3.1). While a dispatch
 * runs, the controls give way to a live status card.
 *
 * See design-handoff/02-components/CommandPanel.md.
 */

import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
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
import { formatSetpoint } from "../../../data/dispatch/format";
import { useAskAnalyst } from "../../../data/analyst/useAskAnalyst";
import { ConfirmationModal } from "../ConfirmationModal/ConfirmationModal";
import { DecisionRecord } from "../DecisionRecord/DecisionRecord";
import {
  SetpointStepper,
  DispatchStatusCard,
  AutopilotToggle,
} from "./CommandPanel.parts";

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

  // The autopilot's standing action follows the live SoC (discharge high,
  // charge low). `override` is the operator's manual setpoint, or null to
  // track autopilot; it's cleared each time a new dispatch starts.
  const auto = useAutopilotProposal(deviceId);
  const [override, setOverride] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const setpointKw = override ?? auto.setpointKw;

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
      </View>

      <View style={{ padding: SPACE[3], gap: SPACE[3] }}>
        {isDesktop ? <AutopilotToggle /> : null}

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
          isDesktop ? (
            <>
              <SetpointStepper valueKw={setpointKw} onChange={setOverride} />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: setpointKw === 0 }}
                dataSet={{ action: "apply" }}
                testID="dispatch-apply"
                disabled={setpointKw === 0}
                onPress={() => setModalOpen(true)}
                style={{
                  paddingVertical: SPACE[2],
                  borderRadius: RADIUS[2],
                  backgroundColor: t.accent,
                  alignItems: "center",
                  opacity: setpointKw === 0 ? 0.35 : 1,
                }}
              >
                <Text
                  style={[
                    resolveTypeStyle(t, "label"),
                    { color: t.textInverse, fontWeight: "700" },
                  ]}
                >
                  Apply
                </Text>
              </Pressable>
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
