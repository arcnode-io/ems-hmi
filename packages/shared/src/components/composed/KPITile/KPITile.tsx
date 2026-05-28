/**
 * KPITile — Tier-1 compact metric for the Overview status strip + KPI panel.
 * Value + unit + label + optional trend + sublabel.
 * Per Rule 1: `colorToken` is a domain color, never a status color.
 * See design-handoff/02-components/KPITile.md.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";

/** Domain color slot — keys of Theme that begin with `color*`. */
export type DomainColorKey =
  | "colorBess"
  | "colorCompute"
  | "colorThermal"
  | "colorGrid";

export type KpiTrend = "up" | "down" | "flat";

export interface KPITileProps {
  /** Uppercase tag. */
  label: string;
  /** Pre-formatted value; `null` → em-dash. */
  value: number | string | null;
  unit?: string;
  sublabel?: string;
  /** Optional icon rendered top-right. Accepts size + color props. */
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  trend?: KpiTrend;
  /** Delta string e.g. "0.03" — required if trend is set. */
  trendValue?: string;
  /** Domain color for the value (Rule 1: never a status color). */
  colorToken?: DomainColorKey;
  /** Renders as a button when provided; navigates to detail. */
  onPress?: () => void;
}

function trendColor(t: Theme, trend: KpiTrend): string {
  return match(trend)
    .with("up", () => t.statusOk)
    .with("down", () => t.statusWarn)
    .with("flat", () => t.textMid)
    .exhaustive();
}

function trendGlyph(trend: KpiTrend): string {
  return match(trend)
    .with("up", () => "↑")
    .with("down", () => "↓")
    .with("flat", () => "→")
    .exhaustive();
}

/**
 * Render a compact KPI tile.
 * @param props KPITile props
 * @returns Pressable when onPress provided, else View
 */
export function KPITile({
  label,
  value,
  unit,
  sublabel,
  icon: Icon,
  trend,
  trendValue,
  colorToken = "colorCompute",
  onPress,
}: KPITileProps): React.ReactElement {
  const t = useTheme();
  const interactive = onPress !== undefined;
  const valueColor = t[colorToken];
  const displayValue = value === null ? "—" : String(value);

  const dataSet = {
    comp: "KPITile",
    interactive: interactive ? "true" : "false",
  } as const;

  const containerStyle = {
    width: 200,
    padding: SPACE[3],
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: RADIUS[3],
  } as const;

  const inner = (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          numberOfLines={1}
          style={[
            resolveTypeStyle(t, "kpiLabel"),
            { color: t.textSoft },
          ]}
        >
          {label}
        </Text>
        {Icon && <Icon size={13} color={t.textSoft} />}
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 4,
          marginTop: SPACE[3],
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "kpiValue"),
            { color: valueColor, fontSize: 26, letterSpacing: -0.5 },
          ]}
        >
          {displayValue}
        </Text>
        {unit ? (
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { color: t.textMid },
            ]}
          >
            {unit}
          </Text>
        ) : null}
        {trend && trendValue && (
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { color: trendColor(t, trend), marginLeft: 4 },
            ]}
          >
            {trendGlyph(trend)} {trendValue}
          </Text>
        )}
      </View>

      {sublabel ? (
        <Text
          numberOfLines={1}
          style={[
            resolveTypeStyle(t, "bodyDense"),
            { color: t.textMid, marginTop: 6 },
          ]}
        >
          {sublabel}
        </Text>
      ) : null}
    </>
  );

  const a11yLabel = `${label}: ${displayValue}${unit ? ` ${unit}` : ""}`;

  if (interactive) {
    return (
      <Pressable
        dataSet={dataSet}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        style={containerStyle}
      >
        {inner}
      </Pressable>
    );
  }
  return (
    <View
      dataSet={dataSet}
      accessibilityRole="summary"
      accessibilityLabel={a11yLabel}
      style={containerStyle}
    >
      {inner}
    </View>
  );
}
