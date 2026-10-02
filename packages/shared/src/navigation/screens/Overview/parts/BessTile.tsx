/**
 * BessTile — Overview KPI tile: fleet SoC gauge + live charge/discharge.
 * The flow line is what carries the demo's "battery covers the curtailment".
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { useFleetKpis } from "../../../../data/kpis/useFleetKpis";
import { IconBess } from "../../../../components/icons/IconBess";
import { RadialGauge } from "./RadialGauge";
import { cardStyle } from "./kpiCard";
import { bessFlow } from "./bessFlow";

export function BessTile(): React.ReactElement {
  const t = useTheme();
  const { fleetSoc, bess } = useFleetKpis();
  const soc = fleetSoc.value;
  const flow = bessFlow(bess.powerW);
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
            {flow.label}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              resolveTypeStyle(t, "label"),
              { color: t.text, fontSize: 17, marginTop: 2 },
            ]}
          >
            {flow.value}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              resolveTypeStyle(t, "bodyDense"),
              { color: t.textMid, marginTop: 2 },
            ]}
          >
            site BESS output
          </Text>
        </View>
      </View>
    </View>
  );
}
