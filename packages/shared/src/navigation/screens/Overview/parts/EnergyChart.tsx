/**
 * EnergyChart — Overview Zone E. 24h stacked bar chart (consumed / stored /
 * exported). Inline SVG; bars are rendered into a fixed viewBox and the SVG
 * stretches to container width.
 */

import React from "react";
import { View, Text } from "react-native";
import { Svg, Line, Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";

type Bar = readonly [hour: string, consumed: number, stored: number, exported: number];

const ENERGY_BARS: readonly Bar[] = [
  ["00", 142, 8, 0], ["02", 138, 12, 0], ["04", 130, 14, 0], ["06", 134, 6, 0],
  ["08", 156, 0, 0], ["10", 178, 0, 12], ["12", 185, 0, 24], ["14", 192, 0, 18],
  ["16", 188, 0, 4], ["18", 176, 4, 0], ["20", 168, 10, 0], ["22", 152, 12, 0],
];

const W = 320;
const H = 120;
const PAD_L = 28;
const PAD_R = 6;
const PAD_T = 8;
const PAD_B = 22;

interface LegendKeyProps {
  label: string;
  color: string;
}

function LegendKey({ label, color }: LegendKeyProps): React.ReactElement {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          {
            color: t.textMid,
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: 0.1,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

interface BarStackProps {
  bar: Bar;
  x: number;
  barW: number;
  chartH: number;
  maxV: number;
  showXLabel: boolean;
  t: Theme;
}

function BarStack({
  bar,
  x,
  barW,
  chartH,
  maxV,
  showXLabel,
  t,
}: BarStackProps): React.ReactElement {
  const [hour, c, s, e] = bar;
  const cH = (c / maxV) * chartH;
  const sH = (s / maxV) * chartH;
  const eH = (e / maxV) * chartH;
  let y = PAD_T + chartH;
  const consumedY = (y -= cH);
  const storedY = sH > 0 ? (y -= sH) : null;
  const exportedY = eH > 0 ? (y -= eH) : null;

  return (
    <>
      <Rect x={x} y={consumedY} width={barW} height={cH} fill={t.colorCompute} rx={1} />
      {storedY !== null && (
        <Rect x={x} y={storedY} width={barW} height={sH} fill={t.colorBess} rx={1} />
      )}
      {exportedY !== null && (
        <Rect x={x} y={exportedY} width={barW} height={eH} fill={t.colorGrid} rx={1} />
      )}
      {showXLabel && (
        <SvgText
          x={x + barW / 2}
          y={H - 6}
          fill={t.textSoft}
          fontSize={9}
          fontFamily={t.fontLabel}
          textAnchor="middle"
        >
          {hour}
        </SvgText>
      )}
    </>
  );
}

export function EnergyChart(): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  const maxV = Math.max(...ENERGY_BARS.map(([, c, s, e]) => c + s + e));
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_B - PAD_T;
  const slot = chartW / ENERGY_BARS.length;
  const barW = slot - 4;

  return (
    <View
      dataSet={{ comp: "EnergyChart" }}
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[3],
        marginBottom: SPACE[5],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        overflow: "hidden",
      }}
    >
      <View
        style={{
          paddingTop: SPACE[3],
          paddingHorizontal: SPACE[4],
          paddingBottom: SPACE[2],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: SPACE[3],
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>
            Energy · 24h
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "cardHeading"),
              {
                color: t.text,
                marginTop: 3,
                ...(isSov
                  ? {
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      fontWeight: "400",
                    }
                  : null),
              },
            ]}
          >
            Power balance
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <LegendKey label="Consumed" color={t.colorCompute} />
          <LegendKey label="Stored" color={t.colorBess} />
          <LegendKey label="Exported" color={t.colorGrid} />
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: SPACE[3],
          paddingBottom: SPACE[3],
        }}
      >
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {[0.25, 0.5, 0.75, 1].map((g) => (
            <Line
              key={g}
              x1={PAD_L}
              x2={W - PAD_R}
              y1={PAD_T + chartH * (1 - g)}
              y2={PAD_T + chartH * (1 - g)}
              stroke={t.chartGrid}
              strokeWidth={1}
            />
          ))}
          {[0, 0.5, 1].map((g) => (
            <SvgText
              key={g}
              x={PAD_L - 5}
              y={PAD_T + chartH * (1 - g) + 3}
              fill={t.textSoft}
              fontSize={9}
              fontFamily={t.fontLabel}
              textAnchor="end"
            >
              {Math.round(maxV * g)}
            </SvgText>
          ))}
          {ENERGY_BARS.map((bar, i) => (
            <BarStack
              key={i}
              bar={bar}
              x={PAD_L + i * slot + 2}
              barW={barW}
              chartH={chartH}
              maxV={maxV}
              showXLabel={i % 2 === 0}
              t={t}
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}
