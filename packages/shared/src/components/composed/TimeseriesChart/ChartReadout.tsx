/**
 * ChartReadout — a small top-right overlay showing the values at the
 * tapped x. Pure presentational; the chart computes the rows.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { RADIUS } from "../../../theme/tokens/primitives";

export interface ReadoutRow {
  label: string;
  color: string;
  /** Series value at the tapped x, or null for a gap / missing point. */
  value: number | null;
}

export interface ChartReadoutProps {
  /** Formatted x — a clock time or a numeric label. */
  xLabel: string;
  rows: readonly ReadoutRow[];
}

export function ChartReadout({
  xLabel,
  rows,
}: ChartReadoutProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      dataSet={{ comp: "ChartReadout" }}
      style={{
        position: "absolute",
        top: 6,
        right: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[2],
      }}
    >
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          {
            fontSize: 8,
            letterSpacing: 0.2,
            color: t.textSoft,
            textTransform: "uppercase",
            marginBottom: 1,
          },
        ]}
      >
        {xLabel}
      </Text>
      {rows.map((row) => (
        <View
          key={row.label}
          style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: row.color,
            }}
          />
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              { fontSize: 10, fontWeight: "700", color: t.text },
            ]}
          >
            {row.value === null ? "—" : Math.round(row.value).toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
  );
}
