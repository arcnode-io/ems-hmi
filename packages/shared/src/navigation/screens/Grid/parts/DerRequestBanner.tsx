/**
 * DerRequestBanner — a demand-response dispatch waiting on the operator
 * (MANUAL mode, der_event_state PENDING), or one the operator rejected.
 * Approve/Reject is a real dispatch acceptance: desk console only (Rule 3.1)
 * and always through ConfirmationModal. The active event itself renders in
 * CurtailmentBanner.
 */

import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { GridState } from "../../../../data/grid/useGridState";
import { derBannerKind, type DerDecision } from "../../../../data/grid/derApproval";
import { useDerApproval } from "../../../../data/grid/useDerApproval";
import { useTopologyView } from "../../../../data/topology/useTopologyView";
import { useBreakpoint } from "../../../../hooks/useBreakpoint";
import { ConfirmationModal } from "../../../../components/composed/ConfirmationModal/ConfirmationModal";

const COPY = {
  pending: {
    label: "Demand response request",
    body: "The utility is asking the site to reduce import. Nothing changes until an operator approves.",
  },
  rejected: {
    label: "Dispatch rejected",
    body: "Declined by the operator. The utility sees the site as non-compliant for this event.",
  },
} as const;

function DecisionButton({
  decision,
  onPress,
}: {
  decision: DerDecision;
  onPress: () => void;
}): React.ReactElement {
  const t = useTheme();
  const approve = decision === "approve";
  return (
    <Pressable
      accessibilityRole="button"
      testID={`der-${decision}`}
      onPress={onPress}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: RADIUS[2],
        borderWidth: 1,
        borderColor: approve ? t.accent : t.border,
        backgroundColor: approve ? t.accent : "transparent",
      }}
    >
      <Text style={[resolveTypeStyle(t, "label"), { color: approve ? t.textInverse : t.text, fontWeight: "600" }]}>
        {approve ? "Approve" : "Reject"}
      </Text>
    </Pressable>
  );
}

export function DerRequestBanner({ state }: { state: GridState }): React.ReactElement | null {
  const t = useTheme();
  const { view } = useTopologyView();
  const decide = useDerApproval();
  const isDesktop = useBreakpoint().layout === "desktop";
  const [pendingDecision, setPendingDecision] = useState<DerDecision | null>(null);
  const kind = derBannerKind(state);
  if (kind !== "pending" && kind !== "rejected") return null;
  const copy = COPY[kind];
  const tone = kind === "pending" ? t.statusWarn : t.textMid;

  return (
    <View
      dataSet={{ comp: "DerRequestBanner", state: kind }}
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[3],
        padding: SPACE[3],
        borderRadius: RADIUS[3],
        borderWidth: 1,
        borderColor: `${tone}66`,
        borderLeftWidth: 3,
        borderLeftColor: tone,
        backgroundColor: `${tone}14`,
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[3],
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: tone }]}>{copy.label}</Text>
        <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text }]}>{copy.body}</Text>
      </View>
      {kind === "pending" && decide !== null ? (
        isDesktop ? (
          <View style={{ flexDirection: "row", gap: SPACE[2] }}>
            <DecisionButton decision="reject" onPress={() => setPendingDecision("reject")} />
            <DecisionButton decision="approve" onPress={() => setPendingDecision("approve")} />
          </View>
        ) : (
          <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft }]}>Approve at the desk console</Text>
        )
      ) : null}
      <ConfirmationModal
        visible={pendingDecision !== null}
        commandSummary={
          pendingDecision === "approve" ? "Approve demand-response dispatch" : "Reject demand-response dispatch"
        }
        targetDevices={[{ id: "der_dispatch", name: "Utility DER dispatch", currentState: "Pending approval" }]}
        simMode={view?.ems_mode === "sim"}
        onConfirm={() => {
          if (pendingDecision !== null) decide?.(pendingDecision);
          setPendingDecision(null);
        }}
        onCancel={() => setPendingDecision(null)}
      />
    </View>
  );
}
