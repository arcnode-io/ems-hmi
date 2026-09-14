/**
 * GridScreen — `/modules/grid` route. Site/PCC-scope utility relationship:
 * import limit, curtailment, and island state apply to every grid module
 * at once, so this is the site's grid page, not a per-device one (handoff
 * rule 1). Reached via a CTA on the Modules screen, same as SLD.
 *
 * Composition mirrors grid-detail-desktop.jsx / grid-screen.jsx's Live tab.
 * Events + Alarms tabs aren't built yet — the events log needs a
 * historical-telemetry source that doesn't exist anywhere in the app yet
 * (flagged to backend-engineer 2026-09-13); shipping the Live tab alone
 * rather than build it against fake data.
 */

import React from "react";
import { ScrollView, View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import { useGridState } from "../../../data/grid/useGridState";
import { CurtailmentBanner } from "./parts/CurtailmentBanner";
import { InterconnectPanel } from "./parts/InterconnectPanel";
import { UtilityLimitsPanel } from "./parts/UtilityLimitsPanel";
import { IslandNote } from "./parts/IslandNote";
import { GridModulesPanel } from "./parts/GridModulesPanel";

function headerStatus(state: ReturnType<typeof useGridState>): {
  label: string;
  color: (t: ReturnType<typeof useTheme>) => string;
} {
  if (state.mode === "ISLAND" && state.islandQualifier === "fault") {
    return { label: "ALARM", color: (t) => t.statusAlarm };
  }
  if (state.mode === "ISLAND") return { label: "ISLAND", color: (t) => t.statusWarn };
  if (state.curtailmentActive) return { label: "CURTAILED", color: (t) => t.statusWarn };
  return { label: "OK", color: (t) => t.statusOk };
}

export function GridScreen(): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  const state = useGridState();
  const status = headerStatus(state);
  const statusColor = status.color(t);

  return (
    <ScrollView
      dataSet={{ comp: "GridScreen" }}
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingBottom: SPACE[5] }}
    >
      <View
        style={{
          marginTop: SPACE[3],
          marginHorizontal: SPACE[4],
          flexDirection: "row",
          alignItems: "center",
          gap: SPACE[3],
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={[
              resolveTypeStyle(t, "screenTitle"),
              {
                fontSize: 22,
                color: t.text,
                lineHeight: 22,
                letterSpacing: isSov ? 0.5 : 0,
                ...(isSov ? { textTransform: "uppercase" } : null),
              },
            ]}
          >
            {isSov ? "GRID" : "Grid"}
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              { fontSize: 9, letterSpacing: 0.2, color: t.textSoft, textTransform: "uppercase", marginTop: 2 },
            ]}
          >
            Point of common coupling · site-wide
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingVertical: 2,
            paddingHorizontal: 8,
            borderRadius: 999,
            backgroundColor: statusColor + "1c",
            borderWidth: 1,
            borderColor: statusColor + "66",
          }}
        >
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: statusColor }} />
          <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: statusColor, fontSize: 10 }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <CurtailmentBanner state={state} />
      {state.mode === "ISLAND" ? <IslandNote state={state} /> : null}
      <InterconnectPanel state={state} />
      <UtilityLimitsPanel state={state} />
      <GridModulesPanel />
    </ScrollView>
  );
}
