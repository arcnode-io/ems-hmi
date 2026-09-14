/**
 * BessRacksPanel — per-rack roster (real bess_rack children of a
 * bess_module). Each rack is its own Tesla Megapack unit with its own
 * telemetry — this is where the module's aggregate numbers actually
 * come from.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { BessRackRow, RackOperatingState } from "../../../../data/bess/useBessRackRoster";

function stateColor(t: Theme, s: RackOperatingState | null): string {
  if (s === "FAULT") return t.statusAlarm;
  if (s === "OFFLINE") return t.statusWarn;
  if (s === null) return t.textSoft;
  return t.statusOk;
}

interface BessRacksPanelProps {
  racks: readonly BessRackRow[];
}

export function BessRacksPanel({ racks }: BessRacksPanelProps): React.ReactElement {
  const t = useTheme();

  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        padding: SPACE[4],
        gap: SPACE[2],
      }}
    >
      <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>
        Racks · {racks.length}
      </Text>
      {racks.length === 0 ? (
        <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft }]}>
          No racks registered under this module.
        </Text>
      ) : (
        racks.map((r) => (
          <View
            key={r.id}
            style={{
              paddingVertical: SPACE[2],
              borderBottomWidth: 1,
              borderBottomColor: t.borderSoft,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[2] }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: stateColor(t, r.operatingState),
                }}
              />
              <Text style={[resolveTypeStyle(t, "label"), { color: t.text, fontWeight: "700", flex: 1 }]}>
                {r.displayName}
              </Text>
              <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft }]}>
                {r.operatingState ?? "—"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACE[4] }}>
              <Metric t={t} label="SoC" value={r.socPercent === null ? "—" : `${r.socPercent.toFixed(0)}%`} />
              <Metric
                t={t}
                label="Power"
                value={
                  r.activePowerW === null
                    ? "—"
                    : `${r.activePowerW >= 0 ? "+" : "−"}${(Math.abs(r.activePowerW) / 1000).toFixed(0)} kW`
                }
              />
              <Metric t={t} label="AC voltage" value={r.acVoltageV === null ? "—" : `${r.acVoltageV.toFixed(0)} V`} />
              <Metric t={t} label="Frequency" value={r.frequencyHz === null ? "—" : `${r.frequencyHz.toFixed(2)} Hz`} />
              <Metric
                t={t}
                label="Energy discharged"
                value={r.energyDischargedWh === null ? "—" : `${(r.energyDischargedWh / 1_000_000).toFixed(2)} MWh`}
              />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function Metric({ t, label, value }: { t: Theme; label: string; value: string }): React.ReactElement {
  return (
    <View>
      <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft, fontSize: 9 }]}>{label}</Text>
      <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text, fontWeight: "600" }]}>{value}</Text>
    </View>
  );
}
