/**
 * StrandedCapacity — Overview Zone B'. Three-bar headroom panel.
 * The constraint that fires first wins the state label (BALANCED, COOLING
 * LIMITED, POWER LIMITED, RUNWAY LIMITED).
 *
 * Currently mocked — wire to per-CDU outlet temp + cluster power + BESS
 * runway hooks when those land.
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";

interface Row {
  label: string;
  /** 0..1 — fraction of envelope used. */
  val: number;
  color: string;
  headline: string;
  sub: string;
}

type State = "BALANCED" | "COOLING LIMITED" | "POWER LIMITED" | "RUNWAY LIMITED";

function deriveState(power: number, cooling: number, runway: number): State {
  const worst = Math.max(power, cooling, runway);
  if (worst < 0.85) return "BALANCED";
  if (cooling >= power && cooling >= runway) return "COOLING LIMITED";
  if (power >= runway) return "POWER LIMITED";
  return "RUNWAY LIMITED";
}

function stateColor(t: Theme, state: State): string {
  return match(state)
    .with("BALANCED", () => t.statusOk)
    .otherwise(() => t.statusWarn);
}

interface RatioRowProps {
  row: Row;
}

function RatioRow({ row }: RatioRowProps): React.ReactElement {
  const t = useTheme();
  return (
    <View style={{ marginTop: 6 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: SPACE[2],
        }}
      >
        <Text style={[resolveTypeStyle(t, "label"), { color: t.textMid }]}>
          {row.label}
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { color: t.text, fontWeight: "600" },
          ]}
        >
          {row.headline}
        </Text>
      </View>
      <View
        style={{
          marginTop: 4,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: t.borderSoft,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${row.val * 100}%`,
            backgroundColor: row.color,
            borderRadius: 2.5,
          }}
        />
      </View>
    </View>
  );
}

export function StrandedCapacity(): React.ReactElement {
  const t = useTheme();
  // Mock ratios per overview JSX
  const power = 0.71;
  const cooling = 0.78;
  const runway = 0.62;
  const state = deriveState(power, cooling, runway);
  const sColor = stateColor(t, state);

  const rows: Row[] = [
    { label: "Power", val: power, color: t.colorCompute, headline: "184 / 260 kW", sub: "76 kW headroom" },
    { label: "Cooling", val: cooling, color: t.colorThermal, headline: "38.4 / 49 °C", sub: "worst CDU · s04" },
    { label: "Runway", val: runway, color: t.colorBess, headline: "6.2 h", sub: "at current load" },
  ];

  return (
    <View
      dataSet={{ comp: "StrandedCapacity", state }}
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[3],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        paddingVertical: SPACE[3],
        paddingHorizontal: SPACE[4],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: SPACE[2],
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "kpiLabel"),
            { color: t.textSoft },
          ]}
        >
          Cluster headroom
        </Text>
        <View
          style={{
            paddingVertical: 2,
            paddingHorizontal: 7,
            borderRadius: RADIUS[2],
            backgroundColor: `${sColor}18`,
            borderWidth: 1,
            borderColor: `${sColor}55`,
          }}
        >
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              {
                color: sColor,
                fontWeight: "700",
                letterSpacing: 0.2,
                textTransform: "uppercase",
              },
            ]}
          >
            {state}
          </Text>
        </View>
      </View>

      {rows.map((r) => (
        <RatioRow key={r.label} row={r} />
      ))}

      <Text
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: t.textSoft, marginTop: SPACE[3], lineHeight: 1.4 },
        ]}
      >
        Power and runway have headroom; cooling is the closest constraint (s04
        CDU at 38.4 °C).
      </Text>
    </View>
  );
}
