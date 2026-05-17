/**
 * DOEHeadroomRow — composable utility-feed surface used in three places:
 *
 *   variant="strip"     → Status Strip GRID segment
 *   variant="stranded"  → Stranded Capacity panel Grid row
 *   variant="controls"  → BESS Controls panel DOE row (above run-mode)
 *
 * Per constitution rule 3.11 + UTILITY-FEEDS.md §6, ISLAND is a distinct
 * semantic state from no-data: the data isn't missing, it's not applicable.
 * Renders a specific island label per variant — NEVER `—`.
 *
 * Fault tokens (STALE/INVALID/COMM_FAIL) elevate to statusWarn/statusAlarm
 * per rule 3.12 severity mapping. No new color tokens needed.
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";

export type DOEVariant = "strip" | "stranded" | "controls";

export type DOEState =
  | "ok"
  | "stale"
  | "invalid"
  | "comm-fail"
  | "island";

export type DOEDirection = "IMP" | "EXP";

export interface DOEHeadroomRowProps {
  variant: DOEVariant;
  state: DOEState;
  /** Active flow direction. Required unless state === "island". */
  direction?: DOEDirection;
  /** Pre-formatted headroom magnitude (e.g. "3.2 MW"). */
  headroom?: string;
  /** Counter-direction magnitude (controls variant always shows both). */
  counterHeadroom?: string;
  /** Used by stranded variant: fraction of import_limit consumed [0..1]. */
  usedFraction?: number;
}

function stateLabel(state: DOEState): string {
  return match(state)
    .with("ok", () => "OK")
    .with("stale", () => "STALE")
    .with("invalid", () => "INVALID")
    .with("comm-fail", () => "COMM FAIL")
    .with("island", () => "ISLAND")
    .exhaustive();
}

function stateColor(t: Theme, state: DOEState): string {
  return match(state)
    .with("ok", () => t.textSoft)
    .with("stale", () => t.statusWarn)
    .with("invalid", () => t.statusAlarm)
    .with("comm-fail", () => t.statusAlarm)
    .with("island", () => t.textSoft)
    .exhaustive();
}

function isFault(state: DOEState): boolean {
  return state === "stale" || state === "invalid" || state === "comm-fail";
}

interface StripProps {
  state: DOEState;
  direction?: DOEDirection;
  headroom?: string;
}

function StripVariant({ state, direction, headroom }: StripProps): React.ReactElement {
  const t = useTheme();
  const isIsland = state === "island";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: 38,
        paddingHorizontal: 12,
        minWidth: 220,
        backgroundColor: t.panel,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[2],
      }}
    >
      <Text
        style={[
          resolveTypeStyle(t, "kpiLabel"),
          { color: t.textSoft },
        ]}
      >
        GRID
      </Text>
      {isIsland ? (
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            {
              fontSize: 12,
              fontWeight: "700",
              color: t.text,
              letterSpacing: 0.18,
              textTransform: "uppercase",
            },
          ]}
        >
          ISLAND
        </Text>
      ) : (
        <>
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              {
                fontSize: 10,
                fontWeight: "700",
                color: t.textMid,
                letterSpacing: 0.18,
                textTransform: "uppercase",
              },
            ]}
          >
            {direction ?? "—"}
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              {
                fontSize: 13,
                fontWeight: "600",
                color: t.text,
                letterSpacing: -0.2,
              },
            ]}
          >
            {direction === "IMP" ? "+" : direction === "EXP" ? "−" : ""}
            {headroom ?? "—"}
          </Text>
        </>
      )}
    </View>
  );
}

interface StrandedProps {
  state: DOEState;
  direction?: DOEDirection;
  headroom?: string;
  usedFraction?: number;
}

function StrandedVariant({
  state,
  direction,
  headroom,
  usedFraction,
}: StrandedProps): React.ReactElement {
  const t = useTheme();
  const isIsland = state === "island";
  const fault = isFault(state);
  const fillPct = isIsland || fault ? 0 : Math.round((usedFraction ?? 0) * 100);
  return (
    <View style={{ width: "100%" }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <Text style={[resolveTypeStyle(t, "label"), { color: t.textMid }]}>
          Grid
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            {
              color: isIsland ? t.textSoft : t.text,
              fontWeight: "600",
            },
          ]}
        >
          {isIsland
            ? "ISLAND · n/a"
            : fault
              ? "—"
              : `${headroom ?? "—"} ${direction ?? "IMP"} free`}
        </Text>
      </View>
      <View
        style={{
          height: 5,
          borderRadius: 2.5,
          backgroundColor: t.borderSoft,
          overflow: "hidden",
        }}
      >
        {!isIsland && !fault ? (
          <View
            style={{
              height: "100%",
              width: `${fillPct}%`,
              backgroundColor: t.colorGrid,
              borderRadius: 2.5,
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

interface ControlsProps {
  state: DOEState;
  headroom?: string;
  counterHeadroom?: string;
}

function ControlsVariant({
  state,
  headroom,
  counterHeadroom,
}: ControlsProps): React.ReactElement {
  const t = useTheme();
  const isIsland = state === "island";
  const fault = isFault(state);
  const sColor = stateColor(t, state);
  const bg = fault ? `${t.statusWarn}10` : t.panel;
  const border = fault ? `${t.statusWarn}55` : t.borderSoft;

  if (isIsland) {
    return (
      <View
        style={{
          padding: SPACE[3],
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: border,
          borderRadius: RADIUS[2],
        }}
      >
        <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>
          DOE HEADROOM
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { fontSize: 13, fontWeight: "600", color: t.text, marginTop: 4 },
          ]}
        >
          ISLAND MODE · no utility coordination
        </Text>
      </View>
    );
  }

  if (fault) {
    return (
      <View
        style={{
          padding: SPACE[3],
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: border,
          borderRadius: RADIUS[2],
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "kpiLabel"),
            { color: sColor },
          ]}
        >
          DOE HEADROOM · UTILITY FEED {stateLabel(state)}
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "bodyDense"),
            { color: t.textMid, marginTop: 4 },
          ]}
        >
          Limits unknown · operating on fallback
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        padding: SPACE[3],
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        borderRadius: RADIUS[2],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>
          DOE HEADROOM
        </Text>
        <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: sColor }]}>
          {stateLabel(state)}
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          gap: SPACE[4],
          marginTop: 6,
          alignItems: "baseline",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { fontSize: 10, color: t.textMid, marginRight: 4 },
            ]}
          >
            IMP
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { fontSize: 16, color: t.text, fontWeight: "500", letterSpacing: -0.3 },
            ]}
          >
            {headroom ?? "—"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { fontSize: 10, color: t.textMid, marginRight: 4 },
            ]}
          >
            EXP
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { fontSize: 16, color: t.textMid, fontWeight: "500", letterSpacing: -0.3 },
            ]}
          >
            {counterHeadroom ?? "—"}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Render a DOE headroom row. Selects the right rendering for the surface
 * via `variant`.
 * @param props DOEHeadroomRow props
 * @returns View element
 */
export function DOEHeadroomRow(props: DOEHeadroomRowProps): React.ReactElement {
  return match(props.variant)
    .with("strip", () => (
      <StripVariant
        state={props.state}
        direction={props.direction}
        headroom={props.headroom}
      />
    ))
    .with("stranded", () => (
      <StrandedVariant
        state={props.state}
        direction={props.direction}
        headroom={props.headroom}
        usedFraction={props.usedFraction}
      />
    ))
    .with("controls", () => (
      <ControlsVariant
        state={props.state}
        headroom={props.headroom}
        counterHeadroom={props.counterHeadroom}
      />
    ))
    .exhaustive();
}
