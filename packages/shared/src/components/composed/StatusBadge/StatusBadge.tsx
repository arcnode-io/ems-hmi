/**
 * StatusBadge — Tier-1 alarm primitive. Variant drives BOTH color AND icon
 * (Rule 1 / a11y). Used by ModuleCard, AlarmRow, SLD nodes, chrome chips.
 * Unacknowledged warn/alarm + always-on fire breathe per rule 3.2 via
 * [[usePulseOpacity]] (0.7↔1.0 over 800ms, ease-in-out).
 *
 * See design-handoff/02-components/StatusBadge.md.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../theme/tokens";
import { RADIUS } from "../../../theme/tokens/primitives";
import { usePulseOpacity } from "../../../hooks/usePulseOpacity";
import { IconAlarm } from "../../icons/IconAlarm";
import { IconWarning } from "../../icons/IconWarning";
import { IconFire } from "../../icons/IconFire";
import { IconWrench } from "../../icons/IconWrench";
import { IconCheck } from "../../icons/IconCheck";

export type StatusVariant =
  | "ok"
  | "warn"
  | "alarm"
  | "fire"
  | "maintenance"
  | "offline"
  | "sim"
  // Utility-feed fault states per UTILITY-FEEDS.md §7. Color elevation
  // follows the spec: stale → statusWarn, invalid + comm-fail → statusAlarm.
  | "stale"
  | "invalid"
  | "comm-fail";

export type StatusBadgeSize = "sm" | "md" | "lg";

export interface StatusBadgeProps {
  variant: StatusVariant;
  /** Uppercase label. Icon-only if omitted. */
  label?: string;
  size?: StatusBadgeSize;
  /** Default true; false enables breathe on warn/alarm/fire. */
  acknowledged?: boolean;
  interactive?: boolean;
  onPress?: () => void;
  /** Accessibility hint, used in ARIA label as "tap to {targetLabel}". */
  targetLabel?: string;
}

interface SizeSpec {
  iconSize: number;
  fontSize: number;
  height: number;
  paddingH: number;
}

const SIZES: Record<StatusBadgeSize, SizeSpec> = {
  sm: { iconSize: 12, fontSize: 9, height: 18, paddingH: 6 },
  md: { iconSize: 14, fontSize: 10, height: 22, paddingH: 8 },
  lg: { iconSize: 18, fontSize: 12, height: 28, paddingH: 11 },
};

function variantColor(t: Theme, v: StatusVariant): string {
  return match(v)
    .with("ok", () => t.statusOk)
    .with("warn", () => t.statusWarn)
    .with("alarm", () => t.statusAlarm)
    .with("fire", () => t.statusFire)
    .with("maintenance", () => t.statusMaintenance)
    .with("offline", () => t.statusOffline)
    .with("sim", () => t.statusSim)
    .with("stale", () => t.statusWarn)
    .with("invalid", () => t.statusAlarm)
    .with("comm-fail", () => t.statusAlarm)
    .exhaustive();
}

function variantIcon(
  v: StatusVariant,
): React.ComponentType<{ size?: number; color?: string }> | null {
  return match(v)
    .with("warn", () => IconWarning)
    .with("alarm", () => IconAlarm)
    .with("fire", () => IconFire)
    .with("maintenance", () => IconWrench)
    .with("ok", () => IconCheck)
    .with("offline", () => null)
    .with("sim", () => null)
    // Fault variants share warning glyphs — stale = caution, invalid +
    // comm-fail = alarm octagon. Glyph difference reinforces severity.
    .with("stale", () => IconWarning)
    .with("invalid", () => IconAlarm)
    .with("comm-fail", () => IconAlarm)
    .exhaustive();
}

/**
 * Append a 2-hex alpha byte to a hex color string. Used for the badge's
 * faint background tint (12%) and outline (30%).
 */
function alphaHex(hex: string, alpha: "18" | "55"): string {
  // Reason: tokens are #rrggbb (7 chars); naive concat works for that shape.
  // Falls through unchanged for rgba/hsla so we never produce malformed CSS.
  if (hex.startsWith("#") && (hex.length === 7 || hex.length === 4)) {
    return `${hex}${alpha}`;
  }
  return hex;
}

/**
 * Render a status badge.
 * @param props StatusBadge props
 * @returns Pressable when interactive, else View
 */
export function StatusBadge({
  variant,
  label,
  size = "md",
  acknowledged = true,
  interactive = false,
  onPress,
  targetLabel,
}: StatusBadgeProps): React.ReactElement {
  const t = useTheme();
  const s = SIZES[size];
  const color = variantColor(t, variant);
  const Icon = variantIcon(variant);
  // Reason: rule 3.2 — fire always breathes; unacked warn/alarm/utility-
  // fault breathe. STALE elevates to warn-class breathing, INVALID +
  // COMM_FAIL to alarm-class.
  const breathing =
    variant === "fire" ||
    ((variant === "warn" ||
      variant === "alarm" ||
      variant === "stale" ||
      variant === "invalid" ||
      variant === "comm-fail") &&
      !acknowledged);
  const opacity = usePulseOpacity(breathing);

  const a11yLabel = label
    ? `${variant} — ${label}${
        interactive && targetLabel ? `, tap to ${targetLabel}` : ""
      }`
    : `${variant} status`;

  const inner = (
    <>
      {Icon ? (
        <Icon size={s.iconSize - 3} color={color} />
      ) : (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            backgroundColor: color,
          }}
        />
      )}
      {label ? (
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            {
              fontSize: s.fontSize,
              fontWeight: "700",
              letterSpacing: 0.18,
              color,
              textTransform: "uppercase",
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
      {interactive && (
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { fontSize: s.fontSize, color },
          ]}
        >
          ›
        </Text>
      )}
    </>
  );

  const containerStyle = {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: s.height,
    paddingHorizontal: s.paddingH,
    borderRadius: RADIUS[2],
    backgroundColor: alphaHex(color, "18"),
    borderWidth: 1,
    borderColor: alphaHex(color, "55"),
    alignSelf: "flex-start",
    opacity,
  } as const;

  const dataSet = {
    comp: "StatusBadge",
    variant,
    acknowledged: acknowledged ? "true" : "false",
    interactive: interactive ? "true" : "false",
  } as const;

  if (interactive) {
    return (
      <Pressable
        dataSet={dataSet}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        onPress={onPress}
        style={containerStyle}
      >
        {inner}
      </Pressable>
    );
  }
  return (
    <View
      dataSet={dataSet}
      // Reason: RN's AccessibilityRole enum doesn't include "status" yet,
      // so we set the ARIA role directly for screen readers.
      role="status"
      accessibilityLabel={a11yLabel}
      style={containerStyle}
    >
      {inner}
    </View>
  );
}
