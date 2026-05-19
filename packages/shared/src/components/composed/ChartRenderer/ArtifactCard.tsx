/**
 * Common chrome around every chat artifact: title row + optional badge +
 * body slot + optional "as of …" footer.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";

export interface ArtifactCardProps {
  title: string;
  dataAsOf?: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}

function relativeTime(iso: string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return iso;
  const seconds = Math.max(0, (Date.now() - ts) / 1000);
  if (seconds < 60) return `${Math.round(seconds)}s ago`;
  const minutes = seconds / 60;
  if (minutes < 90) return `${Math.round(minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function ArtifactCard({
  title,
  dataAsOf,
  badge,
  badgeColor,
  children,
}: ArtifactCardProps): React.ReactElement {
  const t = useTheme();
  const accent = badgeColor ?? t.border;
  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderLeftWidth: badge ? 3 : 1,
        borderLeftColor: accent,
        borderRadius: RADIUS[3],
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: SPACE[2],
          paddingHorizontal: SPACE[3],
          gap: SPACE[2],
          borderBottomWidth: 1,
          borderBottomColor: t.borderSoft,
        }}
      >
        {badge ? (
          <View
            style={{
              paddingVertical: 2,
              paddingHorizontal: 6,
              borderRadius: 2,
              backgroundColor: `${accent}18`,
              borderWidth: 1,
              borderColor: `${accent}55`,
            }}
          >
            <Text
              style={[
                resolveTypeStyle(t, "caption"),
                {
                  fontSize: 9,
                  fontWeight: "700",
                  letterSpacing: 0.18,
                  color: accent,
                  textTransform: "uppercase",
                },
              ]}
            >
              {badge}
            </Text>
          </View>
        ) : null}
        <Text
          style={[
            resolveTypeStyle(t, "cardHeading"),
            { color: t.text, fontSize: 13, flex: 1 },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>
      <View>{children}</View>
      {dataAsOf ? (
        <View
          style={{
            paddingVertical: SPACE[2],
            paddingHorizontal: SPACE[3],
            borderTopWidth: 1,
            borderTopColor: t.borderSoft,
          }}
        >
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              {
                fontSize: 9,
                letterSpacing: 0.18,
                color: t.textSoft,
                textTransform: "uppercase",
              },
            ]}
          >
            as of {relativeTime(dataAsOf)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
