/**
 * Histogram — canonical distribution chart. Used by BESS Detail (cell
 * voltage spread), Compute Detail (GPU temp spread), and Analyst BarSpec.
 *
 * In-range bins use the domain color; outlier bins (straddling a
 * threshold) use statusAlarm — the population's heterogeneity IS the
 * alarm signal. Rule 1 exception explicitly allowed by the contract.
 *
 * See updated-handoff/02-components/Histogram.md.
 */

import React from "react";
import { View, Text } from "react-native";
import { Svg, Line, Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import type { DomainColorKey } from "../KPITile/KPITile";

export interface HistogramProps {
  samples: readonly number[];
  unit: string;
  domainColor: DomainColorKey;
  thresholds?: { min?: number; max?: number };
  /** Override auto bin width (in unit-space). */
  binWidth?: number;
  height?: number;
}

const W = 320;
const PAD_L = 30;
const PAD_R = 10;
const PAD_T = 12;
const PAD_B = 22;
const DEFAULT_HEIGHT = 200;

interface Bin {
  /** Left edge (inclusive) of bin. */
  start: number;
  /** Right edge (exclusive). */
  end: number;
  count: number;
  outlier: boolean;
}

/**
 * Sturges' formula for bin count; capped at 24 to keep the rendering
 * legible at phone widths.
 */
function autoBinCount(n: number): number {
  if (n <= 1) return 1;
  return Math.min(24, Math.ceil(Math.log2(n) + 1));
}

function binSamples(
  samples: readonly number[],
  binWidth: number | undefined,
  thresholds: { min?: number; max?: number } | undefined,
): { bins: Bin[]; minX: number; maxX: number; maxCount: number } | null {
  if (samples.length === 0) return null;
  const minX = Math.min(...samples);
  const maxX = Math.max(...samples);
  if (minX === maxX) {
    return {
      bins: [{ start: minX, end: minX + 1, count: samples.length, outlier: false }],
      minX,
      maxX: maxX + 1,
      maxCount: samples.length,
    };
  }
  const k = binWidth
    ? Math.max(1, Math.ceil((maxX - minX) / binWidth))
    : autoBinCount(samples.length);
  const w = (maxX - minX) / k;
  const bins: Bin[] = Array.from({ length: k }, (_, i) => ({
    start: minX + i * w,
    end: minX + (i + 1) * w,
    count: 0,
    outlier: false,
  }));
  for (const s of samples) {
    const idx = Math.min(k - 1, Math.floor((s - minX) / w));
    const bin = bins[idx];
    if (bin) bin.count++;
  }
  // Reason: a bin is an "outlier bin" if its range straddles or sits
  // beyond a threshold — the constitution wants population-level signal,
  // not point-level alarm.
  for (const bin of bins) {
    if (
      (thresholds?.min !== undefined && bin.start < thresholds.min) ||
      (thresholds?.max !== undefined && bin.end > thresholds.max)
    ) {
      bin.outlier = true;
    }
  }
  const maxCount = Math.max(...bins.map((b) => b.count));
  return { bins, minX, maxX, maxCount };
}

/**
 * Render a histogram of `samples`.
 * @param props Histogram props
 * @returns View element
 */
export function Histogram({
  samples,
  unit,
  domainColor,
  thresholds,
  binWidth,
  height = DEFAULT_HEIGHT,
}: HistogramProps): React.ReactElement {
  const t = useTheme();
  const H = Math.max(120, Math.min(400, height));
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const result = binSamples(samples, binWidth, thresholds);
  const noData = result === null;
  const tone = t[domainColor];

  return (
    <View
      dataSet={{ comp: "Histogram", state: noData ? "no-data" : "ready" }}
      style={{
        padding: SPACE[3],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
      }}
    >
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {/* grid baseline */}
        <Line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={PAD_T + chartH}
          y2={PAD_T + chartH}
          stroke={t.chartGrid}
          strokeWidth={1}
        />

        {/* bins */}
        {result && result.bins.map((bin, i) => {
          const xRange = result.maxX - result.minX || 1;
          const bx = PAD_L + ((bin.start - result.minX) / xRange) * chartW;
          const bw = ((bin.end - bin.start) / xRange) * chartW - 1;
          const bh = result.maxCount > 0 ? (bin.count / result.maxCount) * chartH : 0;
          const by = PAD_T + chartH - bh;
          const fill = bin.outlier ? t.statusAlarm : tone;
          return (
            <Rect
              key={`bin-${i}`}
              data-region="bin"
              data-outlier={bin.outlier ? "true" : "false"}
              x={bx}
              y={by}
              width={Math.max(1, bw)}
              height={bh}
              fill={fill}
              opacity={0.85}
              rx={1}
            />
          );
        })}

        {/* thresholds */}
        {result && thresholds?.min !== undefined && (() => {
          const xRange = result.maxX - result.minX || 1;
          const x = PAD_L + ((thresholds.min - result.minX) / xRange) * chartW;
          return (
            <Line
              data-region="threshold"
              x1={x}
              x2={x}
              y1={PAD_T}
              y2={PAD_T + chartH}
              stroke={t.statusAlarm}
              strokeWidth={1}
              strokeDasharray="4,3"
            />
          );
        })()}
        {result && thresholds?.max !== undefined && (() => {
          const xRange = result.maxX - result.minX || 1;
          const x = PAD_L + ((thresholds.max - result.minX) / xRange) * chartW;
          return (
            <Line
              data-region="threshold"
              x1={x}
              x2={x}
              y1={PAD_T}
              y2={PAD_T + chartH}
              stroke={t.statusAlarm}
              strokeWidth={1}
              strokeDasharray="4,3"
            />
          );
        })()}

        {/* x-axis min/max tick labels */}
        {result && [
          { value: result.minX, x: PAD_L, anchor: "start" as const },
          { value: result.maxX, x: W - PAD_R, anchor: "end" as const },
        ].map((tick, i) => (
          <SvgText
            key={`xtick-${i}`}
            x={tick.x}
            y={H - 6}
            fill={t.textSoft}
            fontSize={9}
            fontFamily={t.fontLabel}
            textAnchor={tick.anchor}
          >
            {tick.value.toFixed(2)} {unit}
          </SvgText>
        ))}
      </Svg>

      {noData ? (
        <Text
          style={[
            resolveTypeStyle(t, "bodyDense"),
            { color: t.textSoft, marginTop: SPACE[2], textAlign: "center" },
          ]}
        >
          No samples
        </Text>
      ) : null}
    </View>
  );
}

// Suppress unused-style-import warning until further visual polish lands.
export type { Theme };
