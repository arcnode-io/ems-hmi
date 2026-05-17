/**
 * Gauge — circular arc primitive. Tier-0. SoC %, chiller capacity, PUE.
 * See handoff/02-components/Gauge.md.
 *
 * Fill = domain color (NEVER status — high util is desired). Empty track when no data.
 */

import React from "react";
import { View, Text } from "react-native";
import { Svg, Path, Circle } from "react-native-svg";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type DomainKey } from "../../../theme/tokens";

export type GaugeSize = "sm" | "md" | "lg";

export interface GaugeThreshold {
  value: number;
  token?: "statusWarn" | "statusAlarm";
}

export interface GaugeProps {
  value: number | null;
  min: number;
  max: number;
  unit: string;
  colorToken?: DomainKey;
  thresholds?: GaugeThreshold[];
  label?: string;
  size?: GaugeSize;
}

const SIZE_PX: Record<GaugeSize, number> = { sm: 80, md: 120, lg: 180 };

// Arc sweep: 240° centered at the bottom. Start at 7-o'clock, end at 5-o'clock.
const ARC_START_DEG = 150;
const ARC_END_DEG = 30;
const ARC_SWEEP_DEG = 240;
const STROKE_WIDTH = 4;

/**
 * Convert a polar angle (degrees, 0° = +x axis, CCW) to (x, y) on a unit circle.
 * Returns coordinates centered at (0, 0).
 */
function polar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

/**
 * Build an SVG arc path between two angles at the given radius. Angles in degrees,
 * measured CCW from +x. Centered at (0, 0). Sweep direction is CW (matches gauge convention).
 */
function arcPath(startDeg: number, endDeg: number, radius: number): string {
  const start = polar(startDeg, radius);
  const end = polar(endDeg, radius);
  const sweep = (startDeg - endDeg + 360) % 360;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

/**
 * Render a circular gauge with track + fill arc + value text.
 */
export function Gauge({
  value,
  min,
  max,
  unit,
  colorToken = "bess",
  thresholds,
  label,
  size = "md",
}: GaugeProps): React.ReactElement {
  const t = useTheme();
  const diameter = SIZE_PX[size];
  const radius = (diameter - STROKE_WIDTH) / 2;
  const isNoData = value === null || max <= min;

  const fraction = isNoData
    ? 0
    : Math.max(0, Math.min(1, (value - min) / (max - min)));
  const fillEndDeg = ARC_START_DEG - fraction * ARC_SWEEP_DEG;

  const trackPath = arcPath(ARC_START_DEG, ARC_END_DEG, radius);
  const fillD =
    !isNoData && fraction > 0
      ? arcPath(ARC_START_DEG, fillEndDeg, radius)
      : null;

  const valueStr = isNoData
    ? "—"
    : Math.round(value * 10) / 10 + "";
  const valueRole = size === "lg" ? "display" : "kpiValue";

  return (
    <View
      role="meter"
      aria-valuemin={isNoData ? undefined : min}
      aria-valuemax={isNoData ? undefined : max}
      aria-valuenow={isNoData ? undefined : value}
      aria-label={label}
      dataSet={{
        comp: "Gauge",
        state: isNoData ? "no-data" : "normal",
        size,
      }}
      style={{
        width: diameter,
        height: diameter,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        width={diameter}
        height={diameter}
        viewBox={`${-diameter / 2} ${-diameter / 2} ${diameter} ${diameter}`}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Path
          d={trackPath}
          stroke={t.borderSoft}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
        />
        {fillD !== null && (
          <Path
            d={fillD}
            stroke={t.domainColors[colorToken]}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {thresholds?.map((threshold, idx) => {
          if (max <= min) return null;
          const f = (threshold.value - min) / (max - min);
          if (f < 0 || f > 1) return null;
          const tickDeg = ARC_START_DEG - f * ARC_SWEEP_DEG;
          const tickPos = polar(tickDeg, radius);
          const tickColor =
            threshold.token === "statusWarn" ? t.statusWarn : t.statusAlarm;
          return (
            <Circle
              key={`${threshold.value}-${idx}`}
              cx={tickPos.x}
              cy={tickPos.y}
              r={2}
              fill={tickColor}
            />
          );
        })}
      </Svg>
      <Text
        style={[
          resolveTypeStyle(t, valueRole),
          { color: isNoData ? t.textMid : t.text },
        ]}
      >
        {valueStr}
        {!isNoData && (
          <Text
            style={[resolveTypeStyle(t, "label"), { color: t.textMid }]}
          >
            {" "}
            {unit}
          </Text>
        )}
      </Text>
      {label ? (
        <Text
          style={[
            resolveTypeStyle(t, "kpiLabel"),
            { color: t.textSoft, marginTop: 2 },
          ]}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}
