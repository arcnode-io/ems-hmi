/**
 * GpuClusterStrip — Overview Zone B. One cell per gpu_node showing its live
 * draw. Per Rule 1: load uses the compute domain color, NOT status colors —
 * a hot node is not an alarm. Only throttling (any GPU off `NA`) goes warn.
 *
 * No util fill bar: gpu_node publishes power, not utilization.
 */

import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { IconChevron } from "../../../../components/icons/IconChevron";
import type { GpuFleet } from "../../../../data/compute/useGpuFleet";
import { gpuStripMetrics } from "./gpuStripMetrics";

// Reason: wide enough for a "10.5" kW label at caption size.
const CELL_W = 32;
const CELL_H = 32;
const CELL_GAP = 4;

function NodeCell({ node }: { node: GpuFleet["nodes"][number] }): React.ReactElement {
  const t = useTheme();
  // Reason: unreported = idle styling, so a cold start reads as "no data", not load.
  const idle = node.nodePowerW === null;
  const fill = node.throttling > 0 ? t.statusWarn : t.colorCompute;
  return (
    <View
      style={{
        width: CELL_W,
        height: CELL_H,
        borderRadius: RADIUS[2],
        backgroundColor: idle ? t.borderSoft : fill,
        borderWidth: 1,
        borderColor: idle ? t.border : "transparent",
        opacity: idle ? 0.55 : 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          { color: idle ? t.textSoft : "#fff", fontWeight: "700", fontSize: 9 },
        ]}
      >
        {node.nodePowerW === null ? "—" : (node.nodePowerW / 1000).toFixed(1)}
      </Text>
    </View>
  );
}

interface MetricCellProps {
  label: string;
  value: string;
  unit: string;
  showDivider: boolean;
  /** Value color override (e.g. warn when GPUs throttle). */
  tone?: string;
}

function MetricCell({ label, value, unit, showDivider, tone }: MetricCellProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: SPACE[2],
        paddingHorizontal: SPACE[3],
        borderRightWidth: showDivider ? 1 : 0,
        borderRightColor: t.borderSoft,
      }}
    >
      <Text
        style={[
          resolveTypeStyle(t, "kpiLabel"),
          { color: t.textSoft },
        ]}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3, marginTop: 2 }}>
        <Text
          style={[
            resolveTypeStyle(t, "kpiValue"),
            { color: tone ?? t.text, fontSize: 18, letterSpacing: -0.3 },
          ]}
        >
          {value}
        </Text>
        <Text style={[resolveTypeStyle(t, "label"), { color: t.textMid, fontSize: 10 }]}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

export function GpuClusterStrip({ fleet }: { fleet: GpuFleet }): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  const metrics = gpuStripMetrics(fleet);

  return (
    <View
      dataSet={{ comp: "GpuClusterStrip" }}
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[3],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        overflow: "hidden",
      }}
    >
      <View
        style={{
          paddingTop: SPACE[3],
          paddingHorizontal: SPACE[4],
          paddingBottom: SPACE[2],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: SPACE[3],
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>
            Compute · {fleet.nodes.length} nodes
          </Text>
          <Text
            numberOfLines={1}
            style={[
              resolveTypeStyle(t, "cardHeading"),
              {
                color: t.text,
                marginTop: 3,
                ...(isSov
                  ? {
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      fontWeight: "400",
                    }
                  : null),
              },
            ]}
          >
            GPU fleet
          </Text>
        </View>
        <IconChevron size={18} color={t.textSoft} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SPACE[4],
          paddingBottom: SPACE[3],
          paddingTop: 2,
          gap: CELL_GAP,
        }}
      >
        {fleet.nodes.map((node) => (
          <NodeCell key={node.deviceId} node={node} />
        ))}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderTopColor: t.borderSoft,
        }}
      >
        <MetricCell
          label="Throttling"
          {...metrics.throttling}
          tone={fleet.throttlingCount > 0 ? t.statusWarn : undefined}
          showDivider
        />
        <MetricCell label="Total draw" {...metrics.totalDraw} showDivider />
        <MetricCell label="Per GPU" {...metrics.perGpu} showDivider={false} />
      </View>
    </View>
  );
}
