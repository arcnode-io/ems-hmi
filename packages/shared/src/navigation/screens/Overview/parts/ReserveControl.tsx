/**
 * ReserveControl — the operator's battery reserve, inside the BESS tile.
 * The battery is held at max(supplier floor, this reserve); whatever it
 * doesn't cover during a curtailment, the compute shed does. Edits are desk
 * console only (Rule 3.1) and always through ConfirmationModal.
 */

import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { useOperatorReserve } from "../../../../data/bess/useOperatorReserve";
import { useDerEventActive } from "../../../../data/grid/useDerEventActive";
import { stepReserveMwh } from "../../../../data/bess/operatorReserve";
import { useTopologyView } from "../../../../data/topology/useTopologyView";
import { useBreakpoint } from "../../../../hooks/useBreakpoint";
import { ConfirmationModal } from "../../../../components/composed/ConfirmationModal/ConfirmationModal";

const mwh = (value: number): string => `${value.toFixed(1)} MWh`;

function SmallButton({ label, testID, onPress }: { label: string; testID: string; onPress: () => void }): React.ReactElement {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: RADIUS[2], borderWidth: 1, borderColor: t.border }}
    >
      <Text style={[resolveTypeStyle(t, "label"), { color: t.text }]}>{label}</Text>
    </Pressable>
  );
}

export function ReserveControl(): React.ReactElement | null {
  const t = useTheme();
  const { view } = useTopologyView();
  const { reserveMwh, setReserveMwh } = useOperatorReserve();
  const isDesktop = useBreakpoint().layout === "desktop";
  const curtailed = useDerEventActive();
  const [draft, setDraft] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  if (setReserveMwh === null || !view?.bess) return null;
  const packMwh = view.bess.pack_mwh;
  const target = draft ?? reserveMwh;
  const step = (direction: 1 | -1): void => setDraft(stepReserveMwh(target, direction, packMwh));

  return (
    <View dataSet={{ comp: "ReserveControl" }} style={{ marginTop: SPACE[2], gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>Reserve</Text>
        <Text testID="reserve-value" style={[resolveTypeStyle(t, "label"), { color: t.text, fontWeight: "600" }]}>
          {mwh(reserveMwh)}
        </Text>
      </View>
      {isDesktop ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[1] }}>
          <SmallButton label="−" testID="reserve-down" onPress={() => step(-1)} />
          <Text style={[resolveTypeStyle(t, "label"), { color: t.textMid, flex: 1, textAlign: "center" }]}>{mwh(target)}</Text>
          <SmallButton label="+" testID="reserve-up" onPress={() => step(1)} />
          {target !== reserveMwh ? <SmallButton label="Set" testID="reserve-set" onPress={() => setConfirming(true)} /> : null}
        </View>
      ) : null}
      {/* Reason: the gateway's shed holds until stand-down (it can't prove the
          battery would absorb released compute). Raising the reserve still
          bites at once; lowering it can't lift caps already applied. */}
      {curtailed ? (
        <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft }]}>
          GPU caps hold until this curtailment ends — set the reserve before one starts.
        </Text>
      ) : null}
      <ConfirmationModal
        visible={confirming}
        commandSummary={`Hold ${mwh(target)} in reserve — below it, GPUs throttle instead`}
        targetDevices={[{ id: "bess", name: "Site battery", currentState: `Reserve ${mwh(reserveMwh)}` }]}
        simMode={view.ems_mode === "sim"}
        onConfirm={() => {
          setReserveMwh(target);
          setDraft(null);
          setConfirming(false);
        }}
        onCancel={() => setConfirming(false)}
      />
    </View>
  );
}
