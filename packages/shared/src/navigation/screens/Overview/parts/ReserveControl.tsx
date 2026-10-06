/**
 * ReserveControl — the operator's battery reserve, inside the BESS tile.
 * The battery is held at max(supplier floor, this reserve); whatever it
 * doesn't cover during a curtailment, the compute shed does. Edits are desk
 * console only (Rule 3.1), two steps: "Edit reserve" opens the edit dialog
 * (typed MWh, −/+, minimum SoC always stated) → Review → a ConfirmationModal
 * stating the action and its GPU impact → Send.
 */

import React, { useEffect, useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { useOperatorReserve } from "../../../../data/bess/useOperatorReserve";
import { useDerEventActive } from "../../../../data/grid/useDerEventActive";
import {
  CONFIRM_TIMEOUT_MS,
  reserveConfirmation,
  stepReserveMwh,
} from "../../../../data/bess/operatorReserve";
import { useTopologyView } from "../../../../data/topology/useTopologyView";
import { useBreakpoint } from "../../../../hooks/useBreakpoint";
import { ConfirmationModal } from "../../../../components/composed/ConfirmationModal/ConfirmationModal";
import { IconChevron } from "../../../../components/icons/IconChevron";

const mwh = (value: number): string => `${value.toFixed(1)} MWh`;

/** Primary action — same accent fill + inverse label as the dialog's Send. */
function PrimaryButton({ label, testID, onPress }: { label: string; testID: string; onPress: () => void }): React.ReactElement {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS[2], backgroundColor: t.accent }}
    >
      <Text style={[resolveTypeStyle(t, "label"), { color: t.textInverse, fontWeight: "700" }]}>{label}</Text>
    </Pressable>
  );
}

/** @param gpusCapped any GPU currently throttled — the note only matters when caps exist */
export function ReserveControl({ gpusCapped }: { gpusCapped: boolean }): React.ReactElement | null {
  const t = useTheme();
  const { view } = useTopologyView();
  const { reserveMwh, setReserveMwh } = useOperatorReserve();
  const isDesktop = useBreakpoint().layout === "desktop";
  const curtailed = useDerEventActive();
  // Dialog state: null = closed; otherwise the text in the MWh field.
  const [input, setInput] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [explainFloor, setExplainFloor] = useState(false);
  // Two steps: edit the value (Review) → confirm the action and its GPU impact (Send).
  const [reviewing, setReviewing] = useState(false);
  // What the operator sent, until the controller's retained echo matches it.
  const [pending, setPending] = useState<{ mwh: number; sentAtMs: number } | null>(null);
  const [, setTick] = useState(0);
  const status = reserveConfirmation(pending, reserveMwh, Date.now());
  useEffect(() => {
    if (status === "confirmed") setPending(null);
  }, [status]);
  useEffect(() => {
    if (pending === null) return undefined;
    // Re-evaluate once the confirm window lapses (no echo = no re-render otherwise).
    const timer = setTimeout(() => setTick((tick) => tick + 1), CONFIRM_TIMEOUT_MS);
    return (): void => clearTimeout(timer);
  }, [pending]);
  if (setReserveMwh === null || !view?.bess) return null;
  const packMwh = view.bess.pack_mwh;
  const typed = Number.parseFloat(input ?? "");
  // Reason: clamp to the pack so a fat-fingered 99 can't read as nonsense;
  // the gateway would also just treat it as "hold everything".
  const target = Number.isFinite(typed) ? Math.min(packMwh, Math.max(0, typed)) : reserveMwh;
  const close = (): void => {
    setInput(null);
    setReviewing(false);
  };
  const step = (direction: 1 | -1): void => setInput(stepReserveMwh(target, direction, packMwh).toFixed(1));

  return (
    <View dataSet={{ comp: "ReserveControl" }} style={{ marginTop: SPACE[2], gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>Reserve</Text>
        <Text testID="reserve-value" style={[resolveTypeStyle(t, "label"), { color: t.text, fontWeight: "600" }]}>
          {mwh(reserveMwh)}
        </Text>
      </View>
      {isDesktop ? (
        <View style={{ alignItems: "flex-end" }}>
          <PrimaryButton label="Edit reserve" testID="reserve-edit" onPress={() => setInput(reserveMwh.toFixed(1))} />
        </View>
      ) : null}
      {status === "waiting" || status === "unconfirmed" ? (
        <Text
          testID="reserve-confirmation"
          style={[resolveTypeStyle(t, "bodyDense"), { color: status === "unconfirmed" ? t.statusWarn : t.textSoft }]}
        >
          {status === "waiting"
            ? `Waiting for controller… (${mwh(pending?.mwh ?? 0)} sent)`
            : `Not confirmed by controller · sent ${mwh(pending?.mwh ?? 0)}`}
        </Text>
      ) : null}
      {/* Reason: the gateway's shed holds until stand-down (it can't prove the
          battery would absorb released compute). Raising the reserve still
          bites at once; lowering it can't lift caps already applied. */}
      {curtailed && gpusCapped ? (
        <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft }]}>
          GPU caps hold until this curtailment ends — set the reserve before one starts.
        </Text>
      ) : null}
      <ConfirmationModal
        visible={input !== null && !reviewing}
        heading="Edit battery reserve"
        commandSummary={`Battery reserve: ${mwh(target)}`}
        targetDevices={[{ id: "bess", name: "Site battery", currentState: `Reserve ${mwh(reserveMwh)}` }]}
        simMode={view.ems_mode === "sim"}
        confirmLabel="Review"
        onConfirm={() => setReviewing(true)}
        onCancel={close}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[2] }}>
          <PrimaryButton label="−" testID="reserve-down" onPress={() => step(-1)} />
          <TextInput
            testID="reserve-input"
            accessibilityLabel="Reserve in MWh"
            inputMode="decimal"
            value={input ?? ""}
            onChangeText={setInput}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={[
              resolveTypeStyle(t, "label"),
              {
                flex: 1,
                textAlign: "center",
                color: t.text,
                // Reason: the one editable thing in the dialog gets the field look
                // (lightest surface + border); the read-only target row has neither.
                backgroundColor: t.bg,
                borderWidth: 1,
                borderColor: inputFocused ? t.borderFocus : t.border,
                borderRadius: RADIUS[2],
                paddingVertical: 4,
              },
            ]}
          />
          <PrimaryButton label="+" testID="reserve-up" onPress={() => step(1)} />
          <Text style={[resolveTypeStyle(t, "label"), { color: t.textMid }]}>{`MWh (0–${packMwh.toFixed(1)})`}</Text>
        </View>
        {/* Minimum SoC is always stated; a chevron discloses its definition (works on touch + keyboard). */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[2], marginTop: SPACE[2] }}>
          <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textMid }]}>
            {`Minimum SoC: ${view.bess.reserve_floor_mwh.toFixed(1)} MWh`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="What is minimum SoC?"
            accessibilityState={{ expanded: explainFloor }}
            testID="min-soc-info"
            onPress={() => setExplainFloor((open) => !open)}
            hitSlop={8}
          >
            <IconChevron size={14} color={t.textMid} dir={explainFloor ? "up" : "down"} />
          </Pressable>
        </View>
        {explainFloor ? (
          <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textMid, marginTop: 4 }]}>
            {`Minimum SoC: the lowest state of charge the battery supplier's warranty allows — ${view.bess.reserve_floor_mwh.toFixed(1)} MWh (${Math.round(view.bess.reserve_floor_pct)}%) here. The system never discharges below it. A reserve above it keeps more energy back.`}
          </Text>
        ) : null}
      </ConfirmationModal>
      <ConfirmationModal
        visible={input !== null && reviewing}
        commandSummary={`Set battery reserve to ${mwh(target)}`}
        targetDevices={[{ id: "bess", name: "Site battery", currentState: `Reserve ${mwh(reserveMwh)}` }]}
        simMode={view.ems_mode === "sim"}
        onConfirm={() => {
          setReserveMwh(target);
          setPending({ mwh: target, sentAtMs: Date.now() });
          close();
        }}
        onCancel={close}
      >
        <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.statusWarn }]}>
          During curtailment at this reserve, GPU performance will be affected
        </Text>
      </ConfirmationModal>
    </View>
  );
}
