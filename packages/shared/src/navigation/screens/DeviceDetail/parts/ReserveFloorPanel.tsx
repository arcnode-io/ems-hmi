/**
 * ReserveFloorPanel — read-only reserve-floor config (rule 6 from the
 * design handoff: no slider, this is an engineering action not an
 * operator control). Real data via useReserveFloor (Dtm.sizing_params).
 *
 * "Request a change" has no real backend action to wire — reserve floor
 * changes go through re-engineering the site's DTM, not an in-app
 * command. Rendered as an inert caption rather than a button that would
 * silently no-op when tapped.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { useReserveFloor } from "../../../../data/bess/useReserveFloor";

export function ReserveFloorPanel(): React.ReactElement {
  const t = useTheme();
  const floor = useReserveFloor();

  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        padding: SPACE[4],
        gap: SPACE[2],
      }}
    >
      <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>Reserve floor</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: SPACE[4] }}>
        <Metric label="Ride-through" value={floor.hours === null ? "—" : `${floor.hours.toFixed(1)} h`} />
        <Metric label="Floor" value={floor.floorMwh === null ? "—" : `${floor.floorMwh.toFixed(1)} MWh`} />
        <Metric label="Of pack" value={floor.pct === null ? "—" : `${floor.pct.toFixed(0)}%`} />
        <Metric label="Pack capacity" value={floor.packMwh === null ? "—" : `${floor.packMwh.toFixed(1)} MWh`} />
      </View>
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          { color: t.textSoft, marginTop: SPACE[1], lineHeight: 14 },
        ]}
      >
        Set at order time from the site's ride-through requirement — an engineering change, not an
        operator control. Request a change through your ARCNODE account team.
      </Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }): React.ReactElement {
  const t = useTheme();
  return (
    <View>
      <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft, fontSize: 9 }]}>{label}</Text>
      <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text, fontWeight: "600" }]}>{value}</Text>
    </View>
  );
}
