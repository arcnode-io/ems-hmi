/**
 * ReserveControl — the operator's battery reserve, inside the BESS tile.
 * The battery is held at max(supplier floor, this reserve); whatever it
 * doesn't cover during a curtailment, the compute shed does. Edits are desk
 * console only (Rule 3.1), two steps: "Edit reserve" opens the edit dialog
 * (typed MWh, −/+, minimum SoC always stated) → Review → a ConfirmationModal
 * stating the action and its GPU impact → Send.
 */

import React, { useEffect, useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { useOperatorReserve } from "../../../../data/bess/useOperatorReserve";
import { useDerEventActive } from "../../../../data/grid/useDerEventActive";
import {
  CONFIRM_TIMEOUT_MS,
  coverHours,
  reserveConfirmation,
  stepReserveMwh,
  toAboveFloorMwh,
  toAbsoluteMwh,
} from "../../../../data/bess/operatorReserve";
import { useTopologyView } from "../../../../data/topology/useTopologyView";
import { useBreakpoint } from "../../../../hooks/useBreakpoint";
import { ConfirmationModal } from "../../../../components/composed/ConfirmationModal/ConfirmationModal";
import { PrimaryButton, coverLine } from "./reserveParts";

const mwh = (value: number): string => `${value.toFixed(1)} MWh`;

/** Live inputs for the cover estimate, from the tile's fleet KPIs. */
export interface ReserveLive {
  socPct: number | null;
  /** Site load the battery must carry at full curtailment: POI import + battery output, W. */
  siteLoadW: number | null;
}

/**
 * @param gpusCapped any GPU currently throttled — the note only matters when caps exist
 * @param live SoC + site load for the live cover estimate
 */
export function ReserveControl({ gpusCapped, live }: { gpusCapped: boolean; live: ReserveLive }): React.ReactElement | null {
  const t = useTheme();
  const { view } = useTopologyView();
  const { reserveMwh, setReserveMwh } = useOperatorReserve();
  const isDesktop = useBreakpoint().layout === "desktop";
  const curtailed = useDerEventActive();
  // Dialog state: null = closed; otherwise the text in the MWh field.
  const [input, setInput] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
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
  const floorMwh = view.bess.reserve_floor_mwh;
  // Reason: the operator works in MWh above minimum SoC (the effective zero —
  // a reserve below it does nothing); the controller stores the absolute.
  const usableMwh = packMwh - floorMwh;
  const reserveAboveMwh = toAboveFloorMwh(reserveMwh, floorMwh);
  const typed = Number.parseFloat(input ?? "");
  const target = Number.isFinite(typed) ? Math.min(usableMwh, Math.max(0, typed)) : reserveAboveMwh;
  const hours = coverHours(live.socPct, packMwh, floorMwh, target, live.siteLoadW);
  const close = (): void => {
    setInput(null);
    setReviewing(false);
  };
  const step = (direction: 1 | -1): void => setInput(stepReserveMwh(target, direction, usableMwh).toFixed(1));

  return (
    <View dataSet={{ comp: "ReserveControl" }} style={{ marginTop: SPACE[2], gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>Reserve</Text>
        <Text testID="reserve-value" style={[resolveTypeStyle(t, "label"), { color: t.text, fontWeight: "600" }]}>
          {mwh(reserveAboveMwh)}
        </Text>
      </View>
      {isDesktop ? (
        <View style={{ alignItems: "flex-end" }}>
          <PrimaryButton label="Edit reserve" testID="reserve-edit" onPress={() => setInput(reserveAboveMwh.toFixed(1))} />
        </View>
      ) : null}
      {status === "waiting" || status === "unconfirmed" ? (
        <Text
          testID="reserve-confirmation"
          style={[resolveTypeStyle(t, "bodyDense"), { color: status === "unconfirmed" ? t.statusWarn : t.textSoft }]}
        >
          {status === "waiting"
            ? `Waiting for controller… (${mwh(toAboveFloorMwh(pending?.mwh ?? 0, floorMwh))} sent)`
            : `Not confirmed by controller · sent ${mwh(toAboveFloorMwh(pending?.mwh ?? 0, floorMwh))}`}
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
        targetDevices={[{ id: "bess", name: "Site battery", currentState: `Reserve ${mwh(reserveAboveMwh)}` }]}
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
          <Text style={[resolveTypeStyle(t, "label"), { color: t.textMid }]}>{`MWh (0–${usableMwh.toFixed(1)})`}</Text>
        </View>
        {hours === null ? null : (
          <Text testID="reserve-cover" style={[resolveTypeStyle(t, "bodyDense"), { color: hours <= 0 ? t.statusWarn : t.text, marginTop: SPACE[2] }]}>
            {coverLine(hours)}
          </Text>
        )}
      </ConfirmationModal>
      <ConfirmationModal
        visible={input !== null && reviewing}
        commandSummary={`Set battery reserve to ${mwh(target)}`}
        targetDevices={[{ id: "bess", name: "Site battery", currentState: `Reserve ${mwh(reserveAboveMwh)}` }]}
        simMode={view.ems_mode === "sim"}
        onConfirm={() => {
          const absoluteMwh = toAbsoluteMwh(target, floorMwh, packMwh);
          setReserveMwh(absoluteMwh);
          setPending({ mwh: absoluteMwh, sentAtMs: Date.now() });
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
