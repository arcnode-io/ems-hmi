/**
 * RangeIndicator — horizontal bar showing position in operating range. Tier-0.
 * Used in measurement rows + per-server table cells where vertical space is the constraint.
 * See design-handoff/02-components/RangeIndicator.md.
 *
 * Fill color = domain color (NEVER status — high util is desired, not alarm).
 */

import React from "react";
import { View } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import type { DomainKey } from "../../../theme/tokens";

export interface RangeThreshold {
  value: number;
  /** Theme token name for the tick color. Defaults to statusAlarm. */
  token?: "statusWarn" | "statusAlarm";
}

export interface RangeIndicatorProps {
  value: number | null;
  min: number;
  max: number;
  colorToken?: DomainKey;
  height?: number;
  thresholds?: RangeThreshold[];
}

/**
 * Compute fill width fraction clamped to [0, 1].
 * @param value Current value (may be null)
 * @param min Range minimum
 * @param max Range maximum
 * @returns Fraction in [0, 1], or 0 if value is null or range invalid
 */
function fillFraction(value: number | null, min: number, max: number): number {
  if (value === null || max <= min) return 0;
  const fraction = (value - min) / (max - min);
  return Math.max(0, Math.min(1, fraction));
}

/**
 * Render a horizontal bar with optional threshold tick marks.
 * @param props RangeIndicator props
 * @returns View element
 */
export function RangeIndicator({
  value,
  min,
  max,
  colorToken = "bess",
  height = 6,
  thresholds,
}: RangeIndicatorProps): React.ReactElement {
  const t = useTheme();
  const isNoData = value === null;
  const fraction = fillFraction(value, min, max);
  const fillColor = t.domainColors[colorToken];
  const range = max - min;

  return (
    <View
      role="progressbar"
      aria-valuemin={isNoData ? undefined : min}
      aria-valuemax={isNoData ? undefined : max}
      aria-valuenow={isNoData ? undefined : value}
      dataSet={{
        comp: "RangeIndicator",
        state: isNoData ? "no-data" : "normal",
      }}
      style={{
        width: "100%",
        height,
        borderRadius: height / 2,
        backgroundColor: t.borderSoft,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {!isNoData && (
        <View
          dataSet={{ region: "fill" }}
          style={{
            width: `${fraction * 100}%`,
            height: "100%",
            backgroundColor: fillColor,
          }}
        />
      )}
      {thresholds?.map((threshold, idx) => {
        if (range <= 0) return null;
        const left = ((threshold.value - min) / range) * 100;
        if (left < 0 || left > 100) return null;
        const tickColor =
          threshold.token === "statusWarn" ? t.statusWarn : t.statusAlarm;
        return (
          <View
            key={`${threshold.value}-${idx}`}
            dataSet={{ region: "threshold" }}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: tickColor,
            }}
          />
        );
      })}
    </View>
  );
}
