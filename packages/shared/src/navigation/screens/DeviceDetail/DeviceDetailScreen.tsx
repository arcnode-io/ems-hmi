/**
 * /devices/:deviceId. Shows the template-declared measurements with
 * their latest values, plus the parent device and device_id.
 */

import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import {
  useNavigation,
  type NavigationProp,
} from "@react-navigation/native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import { useTopologyView } from "../../../data/topology/useTopologyView";
import { useAggregateMeasurements } from "../../../data/mqtt/useAggregateMeasurements";
import { measurementTopic, type TopicUnit } from "../../../data/topics/topicBuilder";
import { useDeploymentIdentity } from "../../../data/deployment/useDeploymentIdentity";
import { CommandPanel } from "../../../components/composed/CommandPanel/CommandPanel";
import type { RootStackParamList } from "../../routes";

/** Template that exposes operator dispatch control. */
const DISPATCHABLE_TEMPLATE = "bess_module";

interface DeviceDetailScreenProps {
  route: { params: { deviceId: string } };
}

export function DeviceDetailScreen({ route }: DeviceDetailScreenProps): React.ReactElement {
  const t = useTheme();
  const nav = useNavigation<NavigationProp<RootStackParamList>>();
  const { view } = useTopologyView();
  const identity = useDeploymentIdentity();
  const deviceId = route.params.deviceId;
  const device = view?.devices[deviceId];
  const template = device ? view?.templates_used[device.template] : undefined;

  const topics = useMemo(() => {
    if (!device || !template) return [];
    return Object.entries(template.measurements).map(([name, m]) =>
      measurementTopic(identity.siteId, device.device_id, name, m.unit as TopicUnit),
    );
  }, [device, template, identity.siteId]);

  const messages = useAggregateMeasurements<number | string>(topics);

  if (!device || !template) {
    return (
      <View style={{ flex: 1, padding: SPACE[4], backgroundColor: t.bg }}>
        <Text style={[resolveTypeStyle(t, "screenTitle"), { color: t.text }]}>Device not found</Text>
        <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft, marginTop: SPACE[2] }]}>
          {deviceId}
        </Text>
      </View>
    );
  }

  const measurementEntries = Object.entries(template.measurements);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: SPACE[4], gap: SPACE[3] }}>
      <Pressable onPress={() => nav.goBack()} accessibilityRole="button">
        <Text style={[resolveTypeStyle(t, "caption"), { fontSize: 10, color: t.accent, textTransform: "uppercase", letterSpacing: 0.18 }]}>
          ← back
        </Text>
      </Pressable>

      <View>
        <Text style={[resolveTypeStyle(t, "screenTitle"), { color: t.text }]}>
          {device.display_name ?? device.device_id}
        </Text>
        <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft, fontSize: 10, letterSpacing: 0.18, textTransform: "uppercase", marginTop: 2 }]}>
          {device.template} · {device.device_id}
        </Text>
        {device.parent ? (
          <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textMid, marginTop: 4 }]}>
            parent: {device.parent}
          </Text>
        ) : null}
      </View>

      <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: RADIUS[3], overflow: "hidden" }}>
        <View style={{ paddingVertical: SPACE[2], paddingHorizontal: SPACE[3], borderBottomWidth: 1, borderBottomColor: t.borderSoft }}>
          <Text style={[resolveTypeStyle(t, "cardHeading"), { color: t.text, fontSize: 13 }]}>
            Measurements
          </Text>
        </View>
        {measurementEntries.length === 0 ? (
          <View style={{ padding: SPACE[3] }}>
            <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft }]}>No measurements declared.</Text>
          </View>
        ) : (
          measurementEntries.map(([name, m], i) => {
            const topic = measurementTopic(identity.siteId, device.device_id, name, m.unit as TopicUnit);
            const msg = messages[topic];
            const value = msg ? (typeof msg.value === "number" ? msg.value.toFixed(2) : msg.value) : "—";
            return (
              <View key={name} style={{ flexDirection: "row", paddingVertical: SPACE[2], paddingHorizontal: SPACE[3], borderTopWidth: i > 0 ? 1 : 0, borderTopColor: t.borderSoft, gap: SPACE[2] }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text }]} numberOfLines={1}>
                    {m.display_name_default ?? name}
                  </Text>
                  <Text style={[resolveTypeStyle(t, "caption"), { fontSize: 9, color: t.textSoft, letterSpacing: 0.15, textTransform: "uppercase" }]} numberOfLines={1}>
                    {name} · {m.unit}
                  </Text>
                </View>
                <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text, fontVariant: ["tabular-nums"] }]}>
                  {value} {typeof msg?.value === "number" ? m.unit : ""}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {device.template === DISPATCHABLE_TEMPLATE ? (
        <CommandPanel
          deviceId={device.device_id}
          deviceDisplayName={device.display_name ?? device.device_id}
        />
      ) : null}
    </ScrollView>
  );
}
