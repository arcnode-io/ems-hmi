/**
 * HealthBar — Overview Zone A. Site-level summary card with status accent +
 * count line, driven by useSiteHealth. The check only shows on proven
 * nominal; unknown gets no glyph (constitution §3.4).
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { IconCheck } from "../../../../components/icons/IconCheck";
import { IconWarning } from "../../../../components/icons/IconWarning";
import type { SiteHealth } from "../../../../data/alarms/siteHealth";

interface HealthBarProps {
  /** Headline e.g. "All systems nominal". */
  headline: string;
  /** Sub-line e.g. "17 modules online · 2 active warnings". */
  detail: string;
  /** Accent color — theme.statusOk / statusWarn / statusAlarm / statusOffline. */
  accentColor: string;
  level: SiteHealth["level"];
  /** Opens the alarms list. */
  onPress: () => void;
}

export function HealthBar({
  headline,
  detail,
  accentColor,
  level,
  onPress,
}: HealthBarProps): React.ReactElement {
  const t = useTheme();
  return (
    <Pressable
      dataSet={{ comp: "HealthBar" }}
      accessibilityRole="link"
      accessibilityLabel={`${headline} — open alarms`}
      onPress={onPress}
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
      {level === "unknown" ? null : (
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
          {level === "nominal" ? (
            <IconCheck size={18} color={accentColor} />
          ) : (
            <IconWarning size={18} color={accentColor} />
          )}
        </View>
      )}
    </Pressable>
  );
}
