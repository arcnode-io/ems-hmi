/**
 * CurtailmentBanner — shown while der_dispatch.event_active is true, and after
 * it ends for as long as GPU caps still hold (phase "releasing", see
 * curtailmentPhase) — so capped GPUs never sit there unexplained.
 * States the utility's ask as the envelope import limit, beside the POI
 * meter (curtailmentLine). The title names the program it came through
 * (curtailmentTitle) — ERCOT flex call vs line constraint. Not target_active_power: upstream it currently
 * carries a reduction magnitude, not a setpoint (backend, 2026-10-02).
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { GridState } from "../../../../data/grid/useGridState";
import type { OperatingEnvelope } from "../../../../data/grid/useOperatingEnvelope";
import type { CurtailmentPhase } from "../../../../data/grid/curtailmentPhase";
import { curtailmentLine, curtailmentTitle, RELEASING_TITLE } from "./curtailmentLine";

export function CurtailmentBanner({
  phase,
  state,
  envelope,
}: {
  phase: CurtailmentPhase;
  state: GridState;
  envelope: OperatingEnvelope;
}): React.ReactElement | null {
  const t = useTheme();
  if (phase === null) return null;

  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[3],
        padding: SPACE[3],
        borderRadius: RADIUS[3],
        borderWidth: 1,
        borderColor: t.statusWarn + "66",
        borderLeftWidth: 3,
        borderLeftColor: t.statusWarn,
        backgroundColor: t.statusWarn + "1f",
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[2],
      }}
    >
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: t.statusWarn }} />
      <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.statusWarn }]}>
        {phase === "releasing" ? RELEASING_TITLE : curtailmentTitle(state.curtailmentProgram)}
      </Text>
      {/* Reason: once released, the utility's limit is no longer the story. */}
      {phase === "active" ? (
        <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text, flex: 1 }]}>
          {curtailmentLine(envelope.importLimitW, state.netActivePowerW)}
        </Text>
      ) : null}
    </View>
  );
}
