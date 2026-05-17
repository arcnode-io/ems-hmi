/**
 * EnergyFlowDiagram — horizontal Sankey snapshot: sources (top bar) →
 * sinks (bottom bar). Stream widths proportional to kW. Sources/sinks
 * sized proportional to their total.
 *
 * Layer ordering chosen so streams don't cross:
 *   Sources (top, L→R):  PV, BESS
 *   Sinks   (bot, L→R):  GRID export, COMPUTE
 *
 * Mock data for now — wire to live power-flow aggregation in step 9b.
 * No dedicated PV / Revenue color tokens; PV reuses colorThermal as a
 * proxy ("not bess, not compute, not grid"). Swap when designer ships
 * a colorPv token.
 */

import React from "react";
import { View, Text } from "react-native";
import { Svg, Path, Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";

const FIXTURE = {
  pv: 2840,
  bessOut: 1620,
  gridOut: 760,
  computeLoad: 3700,
};

const W = 340;
const H = 220;
const PAD_X = 16;
const PAD_Y = 16;
const BAR_H = 30;
const LABEL_H = 18;
const VAL_H = 14;

interface NodeShape {
  kind: "src" | "sink";
  label: string;
  sub: string;
  val: number;
  color: string;
  x: number;
  w: number;
}

interface BandShape {
  key: string;
  color: string;
  val: number;
  x0Left: number;
  x0Right: number;
  x1Left: number;
  x1Right: number;
}

function ribbonPath(b: BandShape, flowTop: number, flowBot: number): string {
  const cy = (flowTop + flowBot) / 2;
  return [
    `M ${b.x0Left} ${flowTop}`,
    `C ${b.x0Left} ${cy}, ${b.x1Left} ${cy}, ${b.x1Left} ${flowBot}`,
    `L ${b.x1Right} ${flowBot}`,
    `C ${b.x1Right} ${cy}, ${b.x0Right} ${cy}, ${b.x0Right} ${flowTop}`,
    "Z",
  ].join(" ");
}

function pvColor(t: Theme): string {
  // PV doesn't have a dedicated token yet; thermal works as a stand-in
  // (orange-warm) and stays in the domain palette per Rule 1.
  return t.colorThermal;
}

interface NodeBarProps {
  node: NodeShape;
  topY: number;
  ink: string;
}

function NodeBar({ node, topY, ink }: NodeBarProps): React.ReactElement {
  const t = useTheme();
  return (
    <>
      <Rect
        x={node.x}
        y={topY}
        width={node.w}
        height={BAR_H}
        fill={node.color}
        rx={2}
        opacity={0.9}
      />
      {node.w >= 40 ? (
        <SvgText
          x={node.x + node.w / 2}
          y={topY + BAR_H / 2 + 4}
          fill={ink}
          fontSize={11}
          fontWeight={700}
          fontFamily={t.fontLabel}
          textAnchor="middle"
          letterSpacing={0.5}
        >
          {node.label}
        </SvgText>
      ) : null}
      <SvgText
        x={node.x + node.w / 2}
        y={node.kind === "src" ? topY - 5 : topY + BAR_H + 12}
        fill={t.textSoft}
        fontSize={9}
        fontFamily={t.fontLabel}
        textAnchor="middle"
        letterSpacing={0.4}
      >
        {node.sub} · {node.val.toLocaleString()} kW
      </SvgText>
    </>
  );
}

export function EnergyFlowDiagram(): React.ReactElement {
  const t = useTheme();
  const isLight = t.name === "solarpunk";
  const ink = isLight ? "#1a140a" : "#ffffff";

  // Source total == sink total at this snapshot (energy conservation).
  const total = FIXTURE.pv + FIXTURE.bessOut;
  const trackW = W - 2 * PAD_X;
  const gap = 20;
  const pxPerKw = (trackW - gap) / total;

  const pvW = FIXTURE.pv * pxPerKw;
  const bessW = FIXTURE.bessOut * pxPerKw;
  const pvX = PAD_X;
  const bessX = PAD_X + pvW + gap;

  const gridW = FIXTURE.gridOut * pxPerKw;
  const computeW = FIXTURE.computeLoad * pxPerKw;
  const gridX = PAD_X;
  const computeX = PAD_X + gridW + gap;

  const topBarY = PAD_Y + LABEL_H;
  const botBarY = H - PAD_Y - VAL_H - BAR_H;
  const flowTop = topBarY + BAR_H;
  const flowBot = botBarY;

  // Stream magnitudes. PV satisfies GRID export first, then COMPUTE.
  const pvToGrid = FIXTURE.gridOut;
  const pvToCompute = FIXTURE.pv - pvToGrid;
  const bessToCompute = FIXTURE.bessOut;

  const bands: BandShape[] = [
    {
      key: "pv-grid",
      color: pvColor(t),
      val: pvToGrid,
      x0Left: pvX,
      x0Right: pvX + pvToGrid * pxPerKw,
      x1Left: gridX,
      x1Right: gridX + gridW,
    },
    {
      key: "pv-compute",
      color: pvColor(t),
      val: pvToCompute,
      x0Left: pvX + pvToGrid * pxPerKw,
      x0Right: pvX + pvW,
      x1Left: computeX,
      x1Right: computeX + pvToCompute * pxPerKw,
    },
    {
      key: "bess-compute",
      color: t.colorBess,
      val: bessToCompute,
      x0Left: bessX,
      x0Right: bessX + bessW,
      x1Left: computeX + pvToCompute * pxPerKw,
      x1Right: computeX + computeW,
    },
  ];

  const nodes: NodeShape[] = [
    { kind: "src", label: "PV", sub: "GEN", val: FIXTURE.pv, color: pvColor(t), x: pvX, w: pvW },
    { kind: "src", label: "BESS", sub: "DISCH", val: FIXTURE.bessOut, color: t.colorBess, x: bessX, w: bessW },
    { kind: "sink", label: "GRID", sub: "EXPORT", val: FIXTURE.gridOut, color: t.colorGrid, x: gridX, w: gridW },
    { kind: "sink", label: "COMPUTE", sub: "LOAD", val: FIXTURE.computeLoad, color: t.colorCompute, x: computeX, w: computeW },
  ];

  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        padding: SPACE[3],
      }}
    >
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {bands.map((b) => (
          <Path key={b.key} d={ribbonPath(b, flowTop, flowBot)} fill={b.color} opacity={0.32} />
        ))}
        {nodes.map((n) => (
          <NodeBar
            key={`${n.kind}-${n.label}`}
            node={n}
            topY={n.kind === "src" ? topBarY : botBarY}
            ink={ink}
          />
        ))}
      </Svg>
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          { color: t.textSoft, marginTop: 4, fontSize: 10 },
        ]}
      >
        Snapshot · PV + BESS feed COMPUTE; surplus PV exports to GRID
      </Text>
    </View>
  );
}
