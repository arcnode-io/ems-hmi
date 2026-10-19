/**
 * BessComponentsPanel — what the BESS module is made of: its racks (AC
 * Megapack) or its battery bank + PCS units (DC-coupled). Each row shows
 * only the readings that component's template has.
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { BessComponentRow, ComponentMetric } from "../../../../data/bess/bessComponents";

const ALARM_STATES: readonly string[] = ["FAULT"];
const WARN_STATES: readonly string[] = ["OFFLINE", "WARNING"];

function stateColor(t: Theme, row: BessComponentRow): string {
  // Reason: ADR §25 — no address yet is neutral, not a fault.
  if (!row.provisioned || row.state === null) return t.statusOffline;
  if (ALARM_STATES.includes(row.state)) return t.statusAlarm;
  if (WARN_STATES.includes(row.state)) return t.statusWarn;
  return t.statusOk;
}

function signedKw(w: number): string {
  return `${w >= 0 ? "+" : "−"}${(Math.abs(w) / 1000).toFixed(0)} kW`;
}

function formatMetric({ key, value }: ComponentMetric): { label: string; value: string } {
  const show = (f: (v: number) => string): string => (value === null ? "—" : f(value));
  return match(key)
    .with("soc", () => ({ label: "SoC", value: show((v) => `${v.toFixed(0)}%`) }))
    .with("power", () => ({ label: "Power", value: show(signedKw) }))
    .with("acVoltage", () => ({ label: "AC voltage", value: show((v) => `${v.toFixed(0)} V`) }))
    .with("frequency", () => ({ label: "Frequency", value: show((v) => `${v.toFixed(2)} Hz`) }))
    .with("dcVoltage", () => ({ label: "DC voltage", value: show((v) => `${v.toFixed(0)} V`) }))
    .with("energyDischarged", () => ({ label: "Energy discharged", value: show((v) => `${(v / 1_000_000).toFixed(2)} MWh`) }))
    .exhaustive();
}

interface BessComponentsPanelProps {
  components: readonly BessComponentRow[];
}

export function BessComponentsPanel({ components }: BessComponentsPanelProps): React.ReactElement {
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
        Components · {components.length}
      </Text>
      {components.length === 0 ? (
        <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft }]}>
          No components registered under this module.
        </Text>
      ) : (
        components.map((c) => (
          <View
            key={c.id}
            style={{
              paddingVertical: SPACE[2],
              borderBottomWidth: 1,
              borderBottomColor: t.borderSoft,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[2] }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: stateColor(t, c) }} />
              <Text style={[resolveTypeStyle(t, "label"), { color: t.text, fontWeight: "700" }]}>
                {c.displayName}
              </Text>
              <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft, flex: 1 }]}>
                {c.template.toUpperCase()}
              </Text>
              <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft }]}>
                {c.provisioned ? (c.state ?? "—") : "Not provisioned"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACE[4] }}>
              {c.metrics.map((m) => {
                const { label, value } = formatMetric(m);
                return <Metric key={m.key} t={t} label={label} value={value} />;
              })}
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
