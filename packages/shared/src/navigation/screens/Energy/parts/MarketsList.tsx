/**
 * MarketsList — table-like view of active market products + their state.
 * Each row: product name, MWh, $, next-clear time, status chip.
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { EDPanel } from "./EDPanel";
import { MOCK_ENERGY, type MarketRow } from "../data/mockEnergy";

function statusColor(t: Theme, status: MarketRow["status"]): string {
  return match(status)
    .with("CLEARED", () => t.statusOk)
    .with("PENDING", () => t.statusWarn)
    .with("ACTIVE", () => t.accent)
    .exhaustive();
}

interface RowProps {
  row: MarketRow;
  showDivider: boolean;
}

function Row({ row, showDivider }: RowProps): React.ReactElement {
  const t = useTheme();
  const sColor = statusColor(t, row.status);
  return (
    <View
      style={{
        paddingVertical: SPACE[2],
        paddingHorizontal: SPACE[3],
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[2],
        borderTopWidth: showDivider ? 1 : 0,
        borderTopColor: t.borderSoft,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={[
            resolveTypeStyle(t, "label"),
            {
              fontSize: 12,
              fontWeight: "600",
              color: t.text,
              letterSpacing: 0.05,
            },
          ]}
        >
          {row.name}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            resolveTypeStyle(t, "caption"),
            {
              fontSize: 9,
              color: t.textSoft,
              textTransform: "uppercase",
              letterSpacing: 0.18,
              marginTop: 1,
            },
          ]}
        >
          {row.product} · next {row.next}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { fontSize: 12, fontWeight: "700", color: t.text },
          ]}
        >
          {row.dollars !== null ? `$${row.dollars}` : "—"}
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "caption"),
            { fontSize: 9, color: t.textSoft, marginTop: 1 },
          ]}
        >
          {row.mwh !== null ? `${row.mwh.toFixed(1)} MWh` : "—"}
        </Text>
      </View>
      <View
        style={{
          paddingVertical: 3,
          paddingHorizontal: 6,
          borderRadius: 2,
          backgroundColor: `${sColor}18`,
          borderWidth: 1,
          borderColor: `${sColor}55`,
          flexShrink: 0,
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "caption"),
            {
              fontSize: 9,
              fontWeight: "700",
              letterSpacing: 0.2,
              color: sColor,
              textTransform: "uppercase",
            },
          ]}
        >
          {row.status}
        </Text>
      </View>
    </View>
  );
}

export function MarketsList(): React.ReactElement {
  return (
    <EDPanel>
      {MOCK_ENERGY.markets.map((row, i) => (
        <Row key={row.id} row={row} showDivider={i > 0} />
      ))}
    </EDPanel>
  );
}
