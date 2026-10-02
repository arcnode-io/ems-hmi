/**
 * ComputeScreen — `/compute` route. Throttle/draw/headroom hero, per-node
 * cap-in-use heatmap, draw distribution, top-N by draw, compute alarms.
 *
 * All live: per-node data from useGpuFleet (one wildcard subscription per
 * gpu_node), capacity from sizing P_compute_total_kW, alarms from useAlarms.
 */

import React from "react";
import { ScrollView, View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import { EDSectionHead } from "../Energy/parts/EDPanel";
import { ComputeHero } from "./parts/ComputeHero";
import { GpuHeatmap } from "./parts/GpuHeatmap";
import { DrawDistribution } from "./parts/DrawDistribution";
import { TopNodes } from "./parts/TopNodes";
import { useGpuFleet } from "../../../data/compute/useGpuFleet";
import { useTopologyView } from "../../../data/topology/useTopologyView";
import { ComputeAlarmsBlock } from "./parts/ComputeAlarmsBlock";

export function ComputeScreen(): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  const fleet = useGpuFleet();
  const { view } = useTopologyView();
  return (
    <ScrollView
      dataSet={{ comp: "ComputeScreen" }}
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingBottom: SPACE[5] }}
    >
      <View
        style={{
          marginTop: SPACE[3],
          marginHorizontal: SPACE[4],
          marginBottom: SPACE[2],
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: SPACE[2],
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
            {isSov ? "COMPUTE" : "Compute"}
          </Text>
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              {
                fontSize: 9,
                letterSpacing: 0.2,
                color: t.textSoft,
                textTransform: "uppercase",
                marginTop: 2,
              },
            ]}
          >
            Cluster · GPUs · Thermal
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                backgroundColor: t.statusOk,
              }}
            />
            <Text
              style={[
                resolveTypeStyle(t, "caption"),
                {
                  fontSize: 9,
                  fontWeight: "600",
                  letterSpacing: 0.18,
                  color: t.statusOk,
                  textTransform: "uppercase",
                },
              ]}
            >
              Live
            </Text>
          </View>
        </View>
      </View>

      <ComputeHero fleet={fleet} capacityKw={view?.sizing_params.P_compute_total_kW ?? 0} />

      <EDSectionHead title="GPU heatmap" meta={`${fleet.nodes.length} nodes`} />
      <GpuHeatmap fleet={fleet} />

      <EDSectionHead title="Per-node draw" meta="distribution" />
      <DrawDistribution fleet={fleet} />

      <EDSectionHead title="Top nodes" meta="by draw" />
      <TopNodes fleet={fleet} />

      <EDSectionHead title="Active alarms" meta="cluster" />
      <ComputeAlarmsBlock />
    </ScrollView>
  );
}
