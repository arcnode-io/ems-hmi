/**
 * DecisionRecord — the deterministic "why this action" block. Reads the
 * standing/active dispatch proposal + live SoC, builds a DecisionRecord
 * (pure), and renders the rationale + cited drivers + expected economics.
 *
 * No card chrome of its own — the host (CommandPanel / ActiveDispatchPanel)
 * provides it. Optional "Ask the Analyst" hand-off when `onAskAnalyst` is set.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { useDispatch } from "../../../data/dispatch/useDispatch";
import { useSubscription } from "../../../data/mqtt/useSubscription";
import { measurementTopic } from "../../../data/topics/topicBuilder";
import { useDeploymentIdentity } from "../../../data/deployment/useDeploymentIdentity";
import { autopilotProposal } from "../../../data/dispatch/autopilot";
import { formatUsd } from "../../../data/dispatch/format";
import {
  buildDecisionRecord,
  type DecisionRecord as DecisionRecordData,
} from "../../../data/dispatch/decisionRecord";

/** SoC fallback before the first measurement lands, percent. */
const NOMINAL_SOC = 60;

export interface DecisionRecordViewProps {
  record: DecisionRecordData;
  /** When set, renders an "Ask the Analyst" hand-off button. */
  onAskAnalyst?: () => void;
}

/** Pure presenter — a titled block, no card chrome. */
export function DecisionRecordView({
  record,
  onAskAnalyst,
}: DecisionRecordViewProps): React.ReactElement {
  const t = useTheme();
  return (
    <View dataSet={{ comp: "DecisionRecord" }} style={{ gap: 6 }}>
      <Text
        style={{
          fontFamily: t.fontLabel,
          fontSize: 9,
          fontWeight: "700",
          letterSpacing: 0.3,
          textTransform: "uppercase",
          color: t.textSoft,
        }}
      >
        Why this action
      </Text>

      <Text
        style={[
          resolveTypeStyle(t, "label"),
          { fontSize: 12, lineHeight: 16, fontWeight: "600", color: t.text },
        ]}
      >
        {record.rationale}
      </Text>

      <View style={{ gap: 3 }}>
        {record.drivers.map((d) => (
          <View key={d} style={{ flexDirection: "row", gap: 6 }}>
            <Text style={{ color: t.colorBess, fontSize: 11, lineHeight: 15 }}>
              ·
            </Text>
            <Text
              style={[
                resolveTypeStyle(t, "caption"),
                { flex: 1, fontSize: 10, lineHeight: 15, color: t.textMid },
              ]}
            >
              {d}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={{
          marginTop: 2,
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: t.borderSoft,
          flexDirection: "row",
          alignItems: "baseline",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "caption"),
            {
              fontSize: 9,
              letterSpacing: 0.18,
              textTransform: "uppercase",
              color: t.textSoft,
            },
          ]}
        >
          {record.action === "Charge" ? "Banking" : "Expected"}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: t.text,
            fontVariant: ["tabular-nums"],
          }}
        >
          {record.action === "Charge"
            ? `${record.energyMwh.toFixed(1)} MWh · ~${formatUsd(record.netProfitUsd)} at the peak`
            : `${formatUsd(record.grossRevenueUsd)} gross · ${formatUsd(record.netProfitUsd)} net`}
        </Text>
        {record.action === "Charge" ? null : (
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              { fontSize: 9, color: t.textSoft },
            ]}
          >
            {record.energyMwh.toFixed(1)} MWh
          </Text>
        )}
      </View>

      {onAskAnalyst ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ask the Analyst about this dispatch"
          dataSet={{ action: "ask-analyst" }}
          onPress={onAskAnalyst}
          style={{
            marginTop: 4,
            alignSelf: "flex-start",
            paddingVertical: 7,
            paddingHorizontal: 11,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: t.accentBorder,
            backgroundColor: t.accentFaint,
          }}
        >
          <Text
            style={{
              fontFamily: t.fontLabel,
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 0.15,
              textTransform: "uppercase",
              color: t.accent,
            }}
          >
            Ask the Analyst →
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export interface DecisionRecordProps {
  deviceId: string;
  onAskAnalyst?: () => void;
}

/** Container — resolves the current proposal + SoC and builds the record. */
export function DecisionRecord({
  deviceId,
  onAskAnalyst,
}: DecisionRecordProps): React.ReactElement {
  const identity = useDeploymentIdentity();
  const { state } = useDispatch();

  const socTopic = measurementTopic(
    identity.siteId,
    deviceId,
    "state_of_charge",
    "percent",
  );
  const socMsg = useSubscription<number>(socTopic);
  const socPct = typeof socMsg?.value === "number" ? socMsg.value : NOMINAL_SOC;

  // Active dispatch → explain that; resting → explain the SoC-aware standing
  // proposal (autopilot discharges high / charges low).
  const proposal = state.proposal ?? autopilotProposal(deviceId, socPct);
  const record = buildDecisionRecord(proposal, socPct);
  return <DecisionRecordView record={record} onAskAnalyst={onAskAnalyst} />;
}
