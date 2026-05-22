/**
 * Common chrome around every analyst artifact — a kind pill, title, export +
 * dismiss actions, the body slot, and an optional "Insight" note footer.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";

export interface ArtifactCardProps {
  /** Header pill text — "Chart" / "Table" / "Error". */
  kindLabel: string;
  title: string;
  /** Terse one-line insight; renders the footer when present. */
  note?: string | null;
  dataAsOf?: string;
  /** Marks a placeholder/demo artifact with a DEMO DATA chip. */
  placeholder?: boolean;
  /** Export button shows only when provided. */
  onExport?: () => void;
  /** Dismiss button shows only when provided. */
  onDismiss?: () => void;
  children: React.ReactNode;
}

function relativeTime(iso: string): string {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return iso;
  const seconds = Math.max(0, (Date.now() - ts) / 1000);
  if (seconds < 60) return `${Math.round(seconds)}s ago`;
  const minutes = seconds / 60;
  if (minutes < 90) return `${Math.round(minutes)}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function Pill({ text, tone }: { text: string; tone: string }): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 9999,
        backgroundColor: `${tone}18`,
        borderWidth: 1,
        borderColor: `${tone}55`,
      }}
    >
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          { fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2, color: tone, textTransform: "uppercase" },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function CardButton({
  glyph,
  label,
  onPress,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
}): React.ReactElement {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      dataSet={{ action: label }}
      onPress={onPress}
      style={{
        width: 22,
        height: 22,
        borderRadius: RADIUS[1],
        borderWidth: 1,
        borderColor: t.borderSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: t.textSoft, fontSize: 11 }}>{glyph}</Text>
    </Pressable>
  );
}

export function ArtifactCard({
  kindLabel,
  title,
  note,
  dataAsOf,
  placeholder = false,
  onExport,
  onDismiss,
  children,
}: ArtifactCardProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      dataSet={{ comp: "ArtifactCard" }}
      style={{
        marginHorizontal: SPACE[4],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          paddingVertical: SPACE[2],
          paddingHorizontal: SPACE[3],
          gap: SPACE[2],
          borderBottomWidth: 1,
          borderBottomColor: t.borderSoft,
        }}
      >
        <Pill text={kindLabel} tone={t.textSoft} />
        {placeholder ? <Pill text="demo data" tone={t.statusWarn} /> : null}
        <Text
          style={[
            resolveTypeStyle(t, "cardHeading"),
            { color: t.text, fontSize: 13, flex: 1 },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {onExport ? <CardButton glyph="↓" label="export" onPress={onExport} /> : null}
        {onDismiss ? <CardButton glyph="✕" label="dismiss" onPress={onDismiss} /> : null}
      </View>

      <View>{children}</View>

      {note ? (
        <View
          style={{
            paddingVertical: SPACE[2],
            paddingHorizontal: SPACE[3],
            borderTopWidth: 1,
            borderTopColor: t.borderSoft,
            backgroundColor: t.bg,
          }}
        >
          <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textMid }]}>
            <Text
              style={[
                resolveTypeStyle(t, "caption"),
                { fontSize: 8.5, fontWeight: "800", letterSpacing: 0.2, color: t.textSoft, textTransform: "uppercase" },
              ]}
            >
              Insight{"  "}
            </Text>
            {note}
          </Text>
        </View>
      ) : null}

      {dataAsOf ? (
        <View
          style={{
            paddingVertical: 5,
            paddingHorizontal: SPACE[3],
            borderTopWidth: 1,
            borderTopColor: t.borderSoft,
          }}
        >
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              { fontSize: 9, letterSpacing: 0.18, color: t.textSoft, textTransform: "uppercase" },
            ]}
          >
            as of {relativeTime(dataAsOf)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
