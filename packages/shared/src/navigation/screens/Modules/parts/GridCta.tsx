/**
 * GridCta — Modules screen call-to-action button to the site-wide Grid
 * page. Mirrors SldCta's role: a site/PCC-scope feature that isn't a
 * per-device DeviceDetail, so it needs its own entry point here rather
 * than a sidebar item (no Grid sidebar entry per the design handoff).
 */

import React from "react";
import { Pressable, View, Text } from "react-native";
import { Svg, Line, Circle } from "react-native-svg";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { IconChevron } from "../../../../components/icons/IconChevron";

interface GridCtaProps {
  onPress: () => void;
}

export function GridCta({ onPress }: GridCtaProps): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open Grid"
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
        <Line x1={4} y1={26} x2={34} y2={26} stroke={t.accent} strokeWidth={1.5} />
        <Line x1={4} y1={26} x2={4} y2={10} stroke={t.accent} strokeWidth={1.5} />
        <Circle cx={4} cy={7} r={3} fill="none" stroke={t.accent} strokeWidth={1.5} />
        <Line x1={19} y1={26} x2={19} y2={16} stroke={t.accent} strokeWidth={1.25} />
        <Circle cx={19} cy={13} r={3} fill={t.accent} />
        <Line x1={30} y1={26} x2={30} y2={14} stroke={t.accent} strokeWidth={1.25} />
        <Circle cx={30} cy={11} r={3} fill="none" stroke={t.accent} strokeWidth={1.5} />
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
          Grid
        </Text>
        <Text
          numberOfLines={1}
          style={[resolveTypeStyle(t, "bodyDense"), { color: t.textMid, marginTop: 1 }]}
        >
          PCC · import limit · curtailment · island
        </Text>
      </View>
      <IconChevron size={18} color={t.accent} />
    </Pressable>
  );
}
