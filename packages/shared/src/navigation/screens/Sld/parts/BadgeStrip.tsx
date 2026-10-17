/**
 * BadgeStrip — Sld screen sub-chrome. Horizontally scrollable list of
 * device chips: domain-color dot + display name + left rail = severity.
 * Tap a chip → focus that node in the diagram (future).
 *
 * Driven from useTopologyView + useAlarms — same shape as the Modules
 * filter chips but per-device, not per-class. A chip with no alarm is
 * only green once its device reports; silent → offline grey (unknown).
 */

import { moduleTypeOf } from "../../Modules/useModuleRows";
import React, { useMemo } from "react";
import { ScrollView, Pressable, View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { useTopologyView } from "../../../../data/topology/useTopologyView";
import { useAlarms } from "../../../../data/alarms/useAlarms";
import { useReportingDevices } from "../../../../data/alarms/reportingDevices";
import type { ModuleType } from "../../../../components/composed/ModuleCard/ModuleCard";

function domainColor(t: Theme, mt: ModuleType): string {
  return match(mt)
    .with("bess", () => t.colorBess)
    .with("compute", () => t.colorCompute)
    .with("grid", () => t.colorGrid)
    .with("thermal", () => t.colorThermal)
    .exhaustive();
}

interface BadgeStripProps {
  onSelect?: (deviceId: string) => void;
}

export function BadgeStrip({ onSelect }: BadgeStripProps): React.ReactElement {
  const t = useTheme();
  const { view } = useTopologyView();
  const alarms = useAlarms();
  const chipIds = useMemo(
    () => (view ? Object.values(view.devices).filter((d) => moduleTypeOf(d.template)).map((d) => d.device_id) : []),
    [view],
  );
  const reporting = useReportingDevices(chipIds);

  const chips = view
    ? Object.entries(view.devices)
        .map(([deviceId, device]) => {
          const moduleType = moduleTypeOf(device.template);
          if (!moduleType) return null;
          const deviceAlarms = alarms.filter((a) => a.deviceId === deviceId);
          const railHex =
            deviceAlarms.some((a) => a.severity === "alarm")
              ? t.statusAlarm
              : deviceAlarms.some((a) => a.severity === "warn")
                ? t.statusWarn
                : reporting.has(deviceId)
                  ? t.statusOk
                  : t.statusOffline;
          return {
            id: deviceId,
            label: device.display_name ?? deviceId,
            moduleType,
            railHex,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
    : [];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{
        backgroundColor: t.panel,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        flexGrow: 0,
        flexShrink: 0,
      }}
      contentContainerStyle={{
        paddingVertical: SPACE[2],
        paddingHorizontal: SPACE[4],
        gap: 6,
      }}
    >
      {chips.map((c) => (
        <Pressable
          key={c.id}
          accessibilityRole="button"
          accessibilityLabel={`Focus ${c.label} on diagram`}
          onPress={(): void => onSelect?.(c.id)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingVertical: 5,
            paddingHorizontal: 9,
            borderRadius: RADIUS[2],
            borderWidth: 1,
            borderColor: t.border,
            borderLeftWidth: 3,
            borderLeftColor: c.railHex,
            backgroundColor: "transparent",
            flexShrink: 0,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: domainColor(t, c.moduleType),
            }}
          />
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              {
                fontSize: 10,
                fontWeight: "600",
                letterSpacing: 0.1,
                color: t.text,
              },
            ]}
          >
            {c.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
