/**
 * GridModulesPanel — device roster for the Grid page. See
 * useGridModulesRoster's doc comment for why this is an allowlist, not a
 * parent-walk.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { useGridModulesRoster } from "../../../../data/grid/useGridModulesRoster";
import { GridPanel } from "./GridPanel";

export function GridModulesPanel(): React.ReactElement {
  const t = useTheme();
  const rows = useGridModulesRoster();

  return (
    <GridPanel title="Grid modules" meta={`${rows.length} feeds`}>
      {rows.map((r) => (
        <View
          key={r.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: SPACE[3],
            paddingBottom: SPACE[2],
            borderBottomWidth: 1,
            borderBottomColor: t.borderSoft,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[resolveTypeStyle(t, "label"), { color: t.text, fontWeight: "700" }]}>
              {r.displayName}
            </Text>
            <Text
              numberOfLines={1}
              style={[resolveTypeStyle(t, "caption"), { color: t.textSoft }]}
            >
              {r.role}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text, fontWeight: "600" }]}>
              {r.reading.v}
            </Text>
            <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft }]}>
              {r.reading.l}
            </Text>
          </View>
        </View>
      ))}
    </GridPanel>
  );
}
