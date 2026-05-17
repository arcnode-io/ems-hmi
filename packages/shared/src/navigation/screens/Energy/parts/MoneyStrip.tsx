/**
 * MoneyStrip — Energy revenue summary. Today's total, stacked-bar by
 * revenue stream (arbitrage / ancillary / capacity), target progress.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { MOCK_ENERGY } from "../data/mockEnergy";

interface RevSegmentProps {
  color: string;
  label: string;
  value: number;
}

function RevSegment({ color, label, value }: RevSegmentProps): React.ReactElement {
  const t = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <View style={{ width: 8, height: 8, backgroundColor: color, borderRadius: 1 }} />
        <Text
          style={[
            resolveTypeStyle(t, "caption"),
            {
              fontSize: 8,
              fontWeight: "600",
              letterSpacing: 0.18,
              color: t.textSoft,
              textTransform: "uppercase",
            },
          ]}
        >
          {label}
        </Text>
      </View>
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          { fontSize: 12, fontWeight: "700", color: t.text },
        ]}
      >
        ${value.toLocaleString()}
      </Text>
    </View>
  );
}

export function MoneyStrip(): React.ReactElement {
  const t = useTheme();
  const r = MOCK_ENERGY.revToday;
  const pct = Math.round((r.total / r.target) * 100);
  const seg = (v: number): number => (v / r.total) * 100;
  // Reason: no dedicated colorRevenue / colorPv tokens yet — reuse
  // domain colors that already carry meaning in the rest of the HMI
  // (grid for arbitrage exposure, bess for stored-energy ancillaries,
  // thermal for capacity payments). Swap to dedicated tokens if/when
  // the designer ships them.
  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[2],
        paddingVertical: SPACE[3],
        paddingHorizontal: SPACE[3],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>
          Revenue today
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "caption"),
            {
              fontSize: 9,
              letterSpacing: 0.15,
              color: t.textSoft,
              textTransform: "uppercase",
            },
          ]}
        >
          target ${(r.target / 1000).toFixed(1)}k ·{" "}
          <Text
            style={{
              color: pct >= 100 ? t.statusOk : t.text,
              fontWeight: "700",
            }}
          >
            {pct}%
          </Text>
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
        <Text
          style={[
            resolveTypeStyle(t, "kpiValue"),
            { color: t.colorGrid, fontSize: 26, letterSpacing: -0.5 },
          ]}
        >
          ${r.total.toLocaleString()}
        </Text>
        <Text style={[resolveTypeStyle(t, "label"), { fontSize: 10, color: t.textMid }]}>
          USD
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          height: 6,
          borderRadius: 3,
          overflow: "hidden",
          backgroundColor: t.borderSoft,
          marginBottom: 8,
        }}
      >
        <View style={{ width: `${seg(r.arbitrage)}%`, backgroundColor: t.colorGrid }} />
        <View style={{ width: `${seg(r.ancillary)}%`, backgroundColor: t.colorBess }} />
        <View style={{ width: `${seg(r.capacity)}%`, backgroundColor: t.colorThermal }} />
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <RevSegment color={t.colorGrid} label="Arbitrage" value={r.arbitrage} />
        <RevSegment color={t.colorBess} label="Ancillary" value={r.ancillary} />
        <RevSegment color={t.colorThermal} label="Capacity" value={r.capacity} />
      </View>
    </View>
  );
}
