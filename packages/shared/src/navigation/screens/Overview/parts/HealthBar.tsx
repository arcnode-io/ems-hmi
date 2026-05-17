/**
 * HealthBar — Overview Zone A. Site-level summary card with status accent +
 * count line. Static for now; driver hook lands when site-state aggregation
 * is wired (see [[useFleetKpis]]).
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { IconCheck } from "../../../../components/icons/IconCheck";

interface HealthBarProps {
  /** Headline e.g. "All systems nominal". */
  headline: string;
  /** Sub-line e.g. "17 modules online · 2 active warnings". */
  detail: string;
  /** Accent color — theme.statusOk / statusWarn / statusAlarm. */
  accentColor: string;
}

export function HealthBar({
  headline,
  detail,
  accentColor,
}: HealthBarProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      dataSet={{ comp: "HealthBar" }}
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[3],
        paddingVertical: SPACE[3],
        paddingHorizontal: SPACE[4],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderLeftWidth: 3,
        borderLeftColor: accentColor,
        borderRadius: RADIUS[3],
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[3],
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            {
              color: accentColor,
              textTransform: "uppercase",
              fontWeight: "600",
              letterSpacing: 0.15,
            },
          ]}
        >
          {headline}
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "bodyDense"),
            { color: t.textMid, marginTop: 2 },
          ]}
        >
          {detail}
        </Text>
      </View>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          backgroundColor: `${accentColor}18`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconCheck size={18} color={accentColor} />
      </View>
    </View>
  );
}
