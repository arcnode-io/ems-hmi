/**
 * GpuClusterStrip — Overview Zone B. Shows N compute servers as a horizontal
 * grid of cells colored by utilization. Per Rule 1: utilization uses the
 * compute domain color, NOT status colors — high util is not an alarm.
 *
 * Data is currently mocked (32 servers) — wire to topology + per-server
 * telemetry when a per-server measurement lands.
 */

import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { IconChevron } from "../../../../components/icons/IconChevron";

const MOCK_SERVERS: readonly number[] = [
  92, 94, 91, 89, 95, 93, 92, 88, 90, 87, 91, 93, 96, 94, 89, 92,
  88, 91, 86, 90, 0, 0, 4, 12, 85, 88, 87, 91, 72, 68, 71, 74,
];

const CELL_W = 26;
const CELL_H = 32;
const CELL_GAP = 4;

function gpuColor(util: number, t: Theme): string {
  if (util < 5) return t.textFaint;
  return t.colorCompute;
}

interface ServerCellProps {
  util: number;
}

function ServerCell({ util }: ServerCellProps): React.ReactElement {
  const t = useTheme();
  const idle = util < 5;
  const baseColor = gpuColor(util, t);
  const opacity = idle ? 0.55 : 0.55 + (util / 100) * 0.45;

  return (
    <View
      style={{
        width: CELL_W,
        height: CELL_H,
        borderRadius: RADIUS[2],
        backgroundColor: idle ? t.borderSoft : baseColor,
        borderWidth: 1,
        borderColor: idle ? t.border : "transparent",
        opacity,
        position: "relative",
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 3,
          right: 3,
          top: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: idle ? t.textFaint : "#fff",
          opacity: 0.85,
          width: ((CELL_W - 8) * util) / 100,
        }}
      />
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          {
            position: "absolute",
            bottom: 4,
            left: 0,
            right: 0,
            textAlign: "center",
            color: idle ? t.textSoft : "#fff",
            fontWeight: "700",
            fontSize: 9,
          },
        ]}
      >
        {idle ? "—" : util}
      </Text>
    </View>
  );
}

interface MetricCellProps {
  label: string;
  value: string;
  unit: string;
  showDivider: boolean;
}

function MetricCell({ label, value, unit, showDivider }: MetricCellProps): React.ReactElement {
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
            { color: t.text, fontSize: 18, letterSpacing: -0.3 },
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

export function GpuClusterStrip(): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  const avgUtil = Math.round(
    MOCK_SERVERS.reduce((s, x) => s + x, 0) / MOCK_SERVERS.length,
  );

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
            Compute · {MOCK_SERVERS.length} servers
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
            Cluster utilization
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
        {MOCK_SERVERS.map((util, i) => (
          <ServerCell key={i} util={util} />
        ))}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderTopColor: t.borderSoft,
        }}
      >
        <MetricCell label="Total draw" value="184.2" unit="kW" showDivider />
        <MetricCell label="Avg util" value={`${avgUtil}`} unit="%" showDivider />
        <MetricCell label="Headroom" value="38.5" unit="kW" showDivider={false} />
      </View>
    </View>
  );
}
