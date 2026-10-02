/**
 * KpiStrip — Overview Zone C. Three bespoke KPI tiles (BESS SoC, Net power,
 * PUE) in a horizontal scroll. Each tile has its own layout — this is NOT
 * the canonical KPITile because every visible field is screen-specific.
 *
 * BESS + net power are live (useFleetKpis); PUE is still static.
 */

import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { useFleetKpis } from "../../../../data/kpis/useFleetKpis";
import { IconBolt } from "../../../../components/icons/IconBolt";
import { IconArrow } from "../../../../components/icons/IconArrow";
import { BessTile } from "./BessTile";
import { PueTile } from "./PueTile";
import { cardStyle } from "./kpiCard";

function NetPowerTile(): React.ReactElement {
  const t = useTheme();
  const { grid } = useFleetKpis();
  const power = grid.powerKw;
  // Direction-aware chip: importing = warn-tinted "Consuming"; exporting =
  // ok-tinted "Exporting"; hold = neutral.
  const direction = grid.label;
  const chipColor =
    direction === "Import" ? t.statusWarn
    : direction === "Export" ? t.statusOk
    : t.textMid;
  const chipLabel =
    direction === "Import" ? "Consuming"
    : direction === "Export" ? "Exporting"
    : direction === "Hold" ? "Holding"
    : "—";
  const sign = power === null ? "" : power < 0 ? "−" : "";
  const valueStr = power === null ? "—" : Math.abs(power).toFixed(1);

  return (
    <View style={cardStyle(t)}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>
          Net power
        </Text>
        <IconBolt size={13} color={t.textSoft} />
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 4,
          marginTop: SPACE[3],
        }}
      >
        {sign ? (
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              { color: t.statusWarn, fontWeight: "700" },
            ]}
          >
            {sign}
          </Text>
        ) : null}
        <Text
          style={[
            resolveTypeStyle(t, "kpiValue"),
            { color: t.text, fontSize: 26, letterSpacing: -0.5 },
          ]}
        >
          {valueStr}
        </Text>
        <Text style={[resolveTypeStyle(t, "label"), { color: t.textMid }]}>kW</Text>
      </View>
      <View
        style={{
          marginTop: SPACE[2],
          flexDirection: "row",
          alignSelf: "flex-start",
          alignItems: "center",
          gap: 5,
          paddingVertical: 2,
          paddingHorizontal: 7,
          borderRadius: RADIUS[2],
          backgroundColor: `${chipColor}15`,
          borderWidth: 1,
          borderColor: `${chipColor}55`,
        }}
      >
        <IconArrow size={10} color={chipColor} dir={direction === "Export" ? "up" : "down"} />
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            {
              color: chipColor,
              fontWeight: "700",
              letterSpacing: 0.18,
              textTransform: "uppercase",
            },
          ]}
        >
          {chipLabel}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: t.textMid, marginTop: SPACE[2] },
        ]}
      >
        {/* TODO: per-source breakdown needs per-device active_power aggregation */}
        Grid only · {grid.frequencyHz !== null ? `${grid.frequencyHz.toFixed(2)} Hz` : "—"}
      </Text>
    </View>
  );
}

export function KpiStrip(): React.ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        marginTop: SPACE[3],
        paddingHorizontal: SPACE[4],
        gap: SPACE[3],
        paddingRight: SPACE[2],
      }}
    >
      <BessTile />
      <NetPowerTile />
      <PueTile />
    </ScrollView>
  );
}
