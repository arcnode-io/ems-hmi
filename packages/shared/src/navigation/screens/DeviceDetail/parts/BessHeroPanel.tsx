/**
 * BessHeroPanel — module-level SoC ring + power/headroom quick-read.
 * Mirrors bess-detail-screen.jsx's HeroPanel, minus fields with no real
 * source (SoH, pack voltage/current, cycles — Tesla Megapack's cell-level
 * BMS data isn't exposed via the Modbus TCP integration; see
 * BessDetailBody's doc comment for the full list).
 */

import React from "react";
import { View, Text } from "react-native";
import { Svg, Circle } from "react-native-svg";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { BessModuleDetail } from "../../../../data/bess/useBessModuleDetail";

function SocRing({ value, color, size = 88 }: { value: number | null; color: string; size?: number }): React.ReactElement {
  const stroke = 8;
  const r = size / 2 - stroke / 2 - 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value));
  const offset = circ * (1 - pct / 100);
  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r} stroke={color + "33"} strokeWidth={stroke} fill="none" />
      {value !== null ? (
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${c}, ${c}`}
        />
      ) : null}
    </Svg>
  );
}

function fmtMw(watts: number | null): string {
  if (watts === null || !Number.isFinite(watts)) return "—";
  const sign = watts >= 0 ? "+" : "−";
  return `${sign}${(Math.abs(watts) / 1_000_000).toFixed(2)} MW`;
}

interface BessHeroPanelProps {
  detail: BessModuleDetail;
}

export function BessHeroPanel({ detail }: BessHeroPanelProps): React.ReactElement {
  const t = useTheme();
  const socColor =
    detail.socPercent !== null && detail.socPercent <= 15
      ? t.statusAlarm
      : detail.socPercent !== null && detail.socPercent <= 25
        ? t.statusWarn
        : t.colorBess;

  return (
    <View
      style={{
        padding: SPACE[4],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[4],
      }}
    >
      <View style={{ width: 88, height: 88 }}>
        <SocRing value={detail.socPercent} color={socColor} />
        <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
          <Text style={[resolveTypeStyle(t, "cardHeading"), { color: t.text, fontSize: 22 }]}>
            {detail.socPercent === null ? "—" : Math.round(detail.socPercent)}
          </Text>
          <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft, fontSize: 9 }]}>SoC %</Text>
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Row t={t} label="Active power" value={fmtMw(detail.activePowerW)} hint={
          detail.activePowerW === null ? undefined : detail.activePowerW >= 0 ? "discharging" : "charging"
        } />
        <Row t={t} label="Import headroom" value={fmtMw(detail.importHeadroomW)} />
        <Row t={t} label="Export headroom" value={fmtMw(detail.exportHeadroomW)} />
      </View>
    </View>
  );
}

function Row({ t, label, value, hint }: { t: ReturnType<typeof useTheme>; label: string; value: string; hint?: string }): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: SPACE[2] }}>
      <Text style={[resolveTypeStyle(t, "label"), { color: t.textMid, flex: 1 }]}>{label}</Text>
      {hint ? <Text style={[resolveTypeStyle(t, "caption"), { color: t.textFaint }]}>{hint}</Text> : null}
      <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text, fontWeight: "600" }]}>{value}</Text>
    </View>
  );
}
