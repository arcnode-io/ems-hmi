/**
 * KpiStrip — Overview Zone C. Three bespoke KPI tiles (BESS SoC, Net power,
 * PUE) in a horizontal scroll. Each tile has its own layout — this is NOT
 * the canonical KPITile because every visible field is screen-specific.
 *
 * Static for now; wire to useFleetKpis when more measurements arrive.
 */

import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { useFleetKpis } from "../../../../data/kpis/useFleetKpis";
import { IconBess } from "../../../../components/icons/IconBess";
import { IconBolt } from "../../../../components/icons/IconBolt";
import { IconArrow } from "../../../../components/icons/IconArrow";
import { RadialGauge } from "./RadialGauge";
import { KpiSpark } from "./KpiSpark";

const CARD_WIDTH = 200;

function cardStyle(t: Theme): React.ComponentProps<typeof View>["style"] {
  return {
    width: CARD_WIDTH,
    padding: SPACE[3],
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: RADIUS[3],
    flexShrink: 0,
  };
}

function BessTile(): React.ReactElement {
  const t = useTheme();
  const { fleetSoc } = useFleetKpis();
  const soc = fleetSoc.value;
  // TODO: runway estimate needs energy-remaining ÷ current discharge rate;
  // both are computable but require kWh capacity from the template + the
  // signed discharge derived from grid power. Lands when [[useBessRunway]]
  // exists; until then show "—" so we don't ship a number we made up.
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
          BESS SoC
        </Text>
        <IconBess size={13} color={t.textSoft} />
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: SPACE[3],
          marginTop: SPACE[2],
        }}
      >
        <View style={{ width: 60, height: 60, position: "relative" }}>
          <RadialGauge
            value={soc ?? 0}
            color={t.colorBess}
            trackColor={t.borderSoft}
            size={60}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={[
                resolveTypeStyle(t, "label"),
                {
                  color: t.text,
                  fontSize: 14,
                  fontWeight: "600",
                  letterSpacing: -0.2,
                },
              ]}
            >
              {soc === null ? "—" : `${Math.round(soc)}%`}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>
            Runway
          </Text>
          <Text
            numberOfLines={1}
            style={[
              resolveTypeStyle(t, "label"),
              { color: t.text, fontSize: 17, marginTop: 2 },
            ]}
          >
            —
          </Text>
          <Text
            numberOfLines={1}
            style={[
              resolveTypeStyle(t, "bodyDense"),
              { color: t.textMid, marginTop: 2 },
            ]}
          >
            awaiting energy-remaining
          </Text>
        </View>
      </View>
    </View>
  );
}

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

function PueTile(): React.ReactElement {
  const t = useTheme();
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
          PUE · 24h
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { color: t.textSoft, fontWeight: "600" },
          ]}
        >
          ‹ 1.20
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          gap: 4,
          marginTop: SPACE[3],
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "kpiValue"),
            { color: t.text, fontSize: 26, letterSpacing: -0.5 },
          ]}
        >
          1.14
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { color: t.statusOk, marginLeft: 4 },
          ]}
        >
          ↓ 0.03
        </Text>
      </View>
      <View style={{ marginTop: SPACE[2] }}>
        <KpiSpark
          color={t.colorThermal}
          points={[1.18, 1.17, 1.19, 1.16, 1.15, 1.16, 1.14, 1.13, 1.14, 1.15, 1.14, 1.13, 1.14]}
        />
      </View>
      <Text
        numberOfLines={1}
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: t.textMid, marginTop: SPACE[2] },
        ]}
      >
        24h · liquid-cooled
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
