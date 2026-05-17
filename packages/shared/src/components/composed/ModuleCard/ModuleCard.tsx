/**
 * ModuleCard — Tier-1 composite for /modules list + Overview.
 * Header (icon · name+sub · StatusBadge) over a 3-column measurement grid.
 * Tap-target is the whole card.
 *
 * See updated-handoff/02-components/ModuleCard.md.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import { usePulseOpacity } from "../../../hooks/usePulseOpacity";
import {
  StatusBadge,
  type StatusVariant,
} from "../StatusBadge/StatusBadge";
import { IconBess } from "../../icons/IconBess";
import { IconCompute } from "../../icons/IconCompute";
import { IconGrid } from "../../icons/IconGrid";
import { IconThermal } from "../../icons/IconThermal";

export type ModuleType = "bess" | "compute" | "thermal" | "grid";

export interface ModuleMeasurement {
  label: string;
  /** Pre-formatted value; renders verbatim. */
  value: string;
  unit?: string;
  /** Optional color hint: a domain key or "ok"/"warn"/"alarm"/"text"/"soft". */
  colorHint?: string;
}

export interface ModuleCardProps {
  moduleType: ModuleType;
  displayName: string;
  /** Optional sub-line (e.g. "lithium · 2 MWh"). */
  sub?: string;
  status: StatusVariant;
  acknowledged?: boolean;
  alarmCount?: number;
  /** Up to 3 metric cells. Extras are clipped. */
  measurements?: ModuleMeasurement[];
  onPress: () => void;
}

function moduleColor(t: Theme, mt: ModuleType): string {
  return match(mt)
    .with("bess", () => t.colorBess)
    .with("compute", () => t.colorCompute)
    .with("grid", () => t.colorGrid)
    .with("thermal", () => t.colorThermal)
    .exhaustive();
}

function moduleIcon(
  mt: ModuleType,
): React.ComponentType<{ size?: number; color?: string }> {
  return match(mt)
    .with("bess", () => IconBess)
    .with("compute", () => IconCompute)
    .with("grid", () => IconGrid)
    .with("thermal", () => IconThermal)
    .exhaustive();
}

function railColor(t: Theme, status: StatusVariant): string | null {
  return match(status)
    .with("fire", () => t.statusFire)
    .with("alarm", () => t.statusAlarm)
    .with("warn", () => t.statusWarn)
    .with("maintenance", () => t.statusMaintenance)
    .with("offline", () => t.statusOffline)
    .otherwise(() => null);
}

function resolveMetricColor(t: Theme, hint?: string): string {
  if (!hint) return t.text;
  return match(hint)
    .with("bess", () => t.colorBess)
    .with("compute", () => t.colorCompute)
    .with("grid", () => t.colorGrid)
    .with("thermal", () => t.colorThermal)
    .with("ok", () => t.statusOk)
    .with("warn", () => t.statusWarn)
    .with("alarm", () => t.statusAlarm)
    .with("soft", () => t.textSoft)
    .otherwise(() => t.text);
}

interface MetricCellProps {
  m: ModuleMeasurement;
  showDivider: boolean;
}

function MetricCell({ m, showDivider }: MetricCellProps): React.ReactElement {
  const t = useTheme();
  const valueColor = resolveMetricColor(t, m.colorHint);
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        paddingVertical: SPACE[2],
        paddingHorizontal: SPACE[3],
        borderRightWidth: showDivider ? 1 : 0,
        borderRightColor: t.borderSoft,
      }}
    >
      <Text
        numberOfLines={1}
        style={[
          resolveTypeStyle(t, "kpiLabel"),
          { fontSize: 9, color: t.textSoft },
        ]}
      >
        {m.label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 2,
          marginTop: 2,
        }}
      >
        <Text
          numberOfLines={1}
          style={[
            resolveTypeStyle(t, "kpiValue"),
            {
              fontSize: 16,
              letterSpacing: -0.3,
              color: valueColor,
            },
          ]}
        >
          {m.value}
        </Text>
        {m.unit ? (
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { fontSize: 10, color: t.textMid },
            ]}
          >
            {m.unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Render a module summary card.
 * @param props ModuleCard props
 * @returns Pressable element
 */
export function ModuleCard({
  moduleType,
  displayName,
  sub,
  status,
  acknowledged = true,
  alarmCount = 0,
  measurements = [],
  onPress,
}: ModuleCardProps): React.ReactElement {
  const t = useTheme();
  const icon = moduleIcon(moduleType);
  const Icon = icon;
  const isOffline = status === "offline";
  const tintColor = isOffline ? t.textFaint : moduleColor(t, moduleType);
  const rail = railColor(t, status);
  // Reason: rule 3.2 — alarm-count badge breathes when > 0 (same surface as
  // chrome badges, so the visual cadence is consistent).
  const badgeOpacity = usePulseOpacity(alarmCount > 0);
  const visibleMetrics = measurements.slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, ${status}${
        alarmCount > 0 ? `, ${alarmCount} alarm${alarmCount === 1 ? "" : "s"}` : ""
      }`}
      dataSet={{
        comp: "ModuleCard",
        status,
        "alarm-count": String(alarmCount),
        "module-type": moduleType,
      }}
      style={{
        width: "100%",
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderLeftWidth: rail ? 3 : 1,
        borderLeftColor: rail ?? t.border,
        borderRadius: RADIUS[3],
        opacity: isOffline ? 0.55 : 1,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: SPACE[3],
          paddingTop: SPACE[3],
          paddingHorizontal: SPACE[3],
          paddingBottom: SPACE[2],
        }}
      >
        <View
          style={{
            position: "relative",
            width: 38,
            height: 38,
            borderRadius: RADIUS[2],
            backgroundColor: `${tintColor}18`,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={22} color={tintColor} />
          {alarmCount > 0 && (
            <View
              dataSet={{ region: "alarm-count" }}
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                minWidth: 16,
                height: 16,
                paddingHorizontal: 4,
                borderRadius: 8,
                backgroundColor: t.statusAlarm,
                borderWidth: 1.5,
                borderColor: t.surface,
                alignItems: "center",
                justifyContent: "center",
                opacity: badgeOpacity,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontFamily: t.fontLabel,
                  fontSize: 10,
                  fontWeight: "700",
                }}
              >
                {alarmCount}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={[
              resolveTypeStyle(t, "label"),
              {
                fontSize: 13,
                fontWeight: "700",
                letterSpacing: 0.1,
                color: t.text,
              },
            ]}
          >
            {displayName}
          </Text>
          {sub ? (
            <Text
              numberOfLines={1}
              style={[
                resolveTypeStyle(t, "bodyDense"),
                { color: t.textMid, marginTop: 1 },
              ]}
            >
              {sub}
            </Text>
          ) : null}
        </View>
        <StatusBadge
          variant={status}
          label={status.toUpperCase().slice(0, 5)}
          size="sm"
          acknowledged={acknowledged}
        />
      </View>

      {visibleMetrics.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            borderTopWidth: 1,
            borderTopColor: t.borderSoft,
          }}
        >
          {visibleMetrics.map((m, i) => (
            <MetricCell
              key={i}
              m={m}
              showDivider={i < visibleMetrics.length - 1}
            />
          ))}
        </View>
      )}
    </Pressable>
  );
}
