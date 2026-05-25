/**
 * StrandedCapacity — Overview Zone B'. 4-way headroom panel after
 * constitution rule 3.11 / UTILITY-FEEDS §2 (added the Grid row).
 *
 * Per rule 3.11: when ISLAND mode is active, the Grid row is excluded
 * from the heaviest-constraint comparison — a correctly islanded site
 * must NOT read as GRID LIMITED.
 *
 * Power/Cooling/Runway still mocked (need new hooks in step 9b). Grid
 * row is live via useOperatingEnvelope.
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { useOperatingEnvelope } from "../../../../data/envelope/useOperatingEnvelope";
import { DOEHeadroomRow } from "../../../../components/composed/DOEHeadroomRow/DOEHeadroomRow";

interface Row {
  label: string;
  /** 0..1 — fraction of envelope used. */
  val: number;
  color: string;
  headline: string;
  sub: string;
}

type State =
  | "BALANCED"
  | "COOLING LIMITED"
  | "POWER LIMITED"
  | "RUNWAY LIMITED"
  | "GRID LIMITED";

/**
 * Pick the worst-case constraint state from a set of ratios. Pass
 * `null` for grid when the site is in ISLAND (excluded per rule 3.11)
 * or when the DOE feed is non-OK (constraint claim degraded with source).
 */
function deriveState(
  power: number,
  cooling: number,
  runway: number,
  grid: number | null,
): State {
  const candidates: Array<["POWER LIMITED" | "COOLING LIMITED" | "RUNWAY LIMITED" | "GRID LIMITED", number]> = [
    ["POWER LIMITED", power],
    ["COOLING LIMITED", cooling],
    ["RUNWAY LIMITED", runway],
  ];
  if (grid !== null) candidates.push(["GRID LIMITED", grid]);
  let winner: State = "BALANCED";
  let worst = 0.85; // below 85% = BALANCED
  for (const [label, val] of candidates) {
    if (val >= worst) {
      worst = val;
      winner = label;
    }
  }
  return winner;
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
  const envelope = useOperatingEnvelope();
  // Mock ratios for Power/Cooling/Runway pending step 9b hooks
  const power = 0.71;
  const cooling = 0.78;
  const runway = 0.62;
  // Grid ratio: excluded from the heaviest-constraint calc when ISLAND
  // (rule 3.11) OR when DOE feed is non-OK (rule 3.10 default override
  // mode: "the constraint claim is degraded if its source is degraded").
  const gridFault =
    envelope.doeState === "stale" ||
    envelope.doeState === "invalid" ||
    envelope.doeState === "comm-fail";
  const gridForCalc =
    envelope.mode === "ISLAND" || gridFault ? null : envelope.usedFraction;
  const state = deriveState(power, cooling, runway, gridForCalc);
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

      {/* Grid row — DOEHeadroomRow stranded variant. Renders even in
          ISLAND/fault so the operator sees why grid headroom is n/a. */}
      <View style={{ marginTop: 6 }}>
        <DOEHeadroomRow
          variant="stranded"
          state={envelope.doeState}
          direction={envelope.direction ?? "IMP"}
          headroom={envelope.headroom}
          usedFraction={envelope.usedFraction ?? 0}
        />
      </View>

      <Text
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: t.textSoft, marginTop: SPACE[3] },
        ]}
      >
        Power and runway have headroom; cooling is the closest constraint (s04
        CDU at 38.4 °C).
      </Text>
    </View>
  );
}
