/**
 * SldCta — Modules screen call-to-action button to the spatial SLD view.
 * Small bespoke SVG glyph + heading + chevron.
 */

import React from "react";
import { Pressable, View, Text } from "react-native";
import { Svg, Line, Rect, Circle } from "react-native-svg";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { IconChevron } from "../../../../components/icons/IconChevron";

interface SldCtaProps {
  onPress: () => void;
}

export function SldCta({ onPress }: SldCtaProps): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open single line diagram"
      onPress={onPress}
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[3],
        paddingVertical: SPACE[3],
        paddingHorizontal: SPACE[4],
        backgroundColor: t.accentFaint,
        borderWidth: 1,
        borderColor: t.accentBorder,
        borderRadius: RADIUS[3],
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[3],
      }}
    >
      <Svg width={38} height={32} viewBox="0 0 38 32">
        <Line x1={3} y1={16} x2={35} y2={16} stroke={t.accent} strokeWidth={1.5} />
        <Line x1={9} y1={16} x2={9} y2={6} stroke={t.accent} strokeWidth={1.25} />
        <Line x1={19} y1={16} x2={19} y2={6} stroke={t.accent} strokeWidth={1.25} />
        <Line x1={29} y1={16} x2={29} y2={6} stroke={t.accent} strokeWidth={1.25} />
        <Rect x={6.5} y={2} width={5} height={4} rx={0.5} fill={t.accent} />
        <Rect x={16.5} y={2} width={5} height={4} rx={0.5} fill={t.accent} />
        <Rect x={26.5} y={2} width={5} height={4} rx={0.5} fill={t.accent} />
        <Line x1={14} y1={16} x2={14} y2={26} stroke={t.accent} strokeWidth={1.25} />
        <Line x1={24} y1={16} x2={24} y2={26} stroke={t.accent} strokeWidth={1.25} />
        <Circle cx={14} cy={28} r={2} fill="none" stroke={t.accent} strokeWidth={1.25} />
        <Circle cx={24} cy={28} r={2} fill="none" stroke={t.accent} strokeWidth={1.25} />
      </Svg>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={[
            resolveTypeStyle(t, "cardHeading"),
            {
              color: t.text,
              fontSize: 16,
              ...(isSov
                ? { textTransform: "uppercase", letterSpacing: 0.4, fontWeight: "400" }
                : null),
            },
          ]}
        >
          Single line diagram
        </Text>
        <Text
          numberOfLines={1}
          style={[
            resolveTypeStyle(t, "bodyDense"),
            { color: t.textMid, marginTop: 1 },
          ]}
        >
          Spatial view · live MQTT bindings
        </Text>
      </View>
      <IconChevron size={18} color={t.accent} />
    </Pressable>
  );
}
