/**
 * StatusStrip — persistent strip below the TopBar with fleet KPIs that scan
 * in one fixation (constitution §4 — info density).
 *
 * Two variants, picked from useBreakpoint:
 *  - Phone: 4 segments (SITE / FLEET SoC / GPU UTIL / GRID) at 38px height.
 *  - Desktop: 6 segments (+ PUE 24h, CLOCK) at 44px height, each with
 *    optional sub-line ("6.2 h runway", "↓ 0.03", etc.).
 *
 * Mirrors `StatusStrip` in design-handoff/03-screens/overview-screen.jsx
 * and `DesktopStatusStrip` in design-handoff/03-screens/desktop-chrome.jsx.
 *
 * Constitution rule 3.5 — every label that's a fleet-level aggregate carries
 * the FLEET / GPU UTIL / GRID qualifier. The strip is the canonical home of
 * those qualified names; per-device variants use the UNIT qualifier instead.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { useBreakpoint } from "../../../hooks/useBreakpoint";

export interface StatusStripItem {
  /** Short uppercase label, e.g. "FLEET SoC". */
  label: string;
  /** Display value, e.g. "74%" or "Nominal". */
  value: string;
  /** Theme token key OR raw hex driving the value text color. Defaults to t.text. */
  color?: string;
  /** When true, prepends a colored status dot before the label. */
  dot?: boolean;
  /** Optional sub-line shown only on the desktop variant ("6.2 h runway"). */
  sub?: string;
}

export interface StatusStripProps {
  items: StatusStripItem[];
}

/**
 * Render a single segment of the strip.
 */
function StripSegment({
  item,
  position,
  total,
  isHero,
  layout,
}: {
  item: StatusStripItem;
  position: number;
  total: number;
  isHero: boolean;
  layout: "phone" | "desktop";
}): React.ReactElement {
  const t = useTheme();
  const isDesktop = layout === "desktop";
  const dotColor = item.color ?? t.text;
  const valueColor = isHero ? dotColor : t.text;
  return (
    <View
      dataSet={{ comp: "StatusStrip.Segment", label: item.label }}
      style={{
        flex: 1,
        borderRightWidth: position < total - 1 ? 1 : 0,
        borderRightColor: t.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: isDesktop ? "flex-start" : "center",
        gap: isDesktop ? 10 : 6,
        paddingHorizontal: isDesktop ? t.space[4] : 4,
        minWidth: 0,
      }}
    >
      {item.dot && (
        <View
          style={{
            width: isDesktop ? 8 : 7,
            height: isDesktop ? 8 : 7,
            borderRadius: isDesktop ? 4 : 3.5,
            backgroundColor: dotColor,
            // Halo per constitution — same color at 25% alpha, 3px ring.
            shadowColor: dotColor,
            shadowOpacity: 0.25,
            shadowRadius: 3,
          }}
        />
      )}
      <View style={{ minWidth: 0, flex: isDesktop ? 1 : undefined }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: t.fontLabel,
            fontSize: 9,
            fontWeight: "600",
            letterSpacing: 0.18,
            color: t.textSoft,
            textTransform: "uppercase",
          }}
        >
          {item.label}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: 6,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontFamily: t.fontLabel,
              fontSize: isDesktop ? 14 : 12,
              fontWeight: "600",
              color: valueColor,
              letterSpacing: isDesktop ? -0.2 : 0,
            }}
          >
            {item.value}
          </Text>
          {isDesktop && item.sub && (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: t.fontLabel,
                fontSize: 10,
                color: t.textSoft,
              }}
            >
              {item.sub}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

/**
 * Render the persistent KPI strip. Slices `items` to 4 on phone, 6 on desktop
 * so callers can pass either set and rely on the strip to coarsen.
 * @param props items (4 expected on phone, up to 6 on desktop)
 * @returns View element
 */
export function StatusStrip(props: StatusStripProps): React.ReactElement {
  const t = useTheme();
  const { layout } = useBreakpoint();
  const isDesktop = layout === "desktop";
  const items = isDesktop ? props.items.slice(0, 6) : props.items.slice(0, 4);

  return (
    <View
      dataSet={{ comp: "StatusStrip", layout }}
      style={{
        height: isDesktop ? 44 : 38,
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        backgroundColor: t.panel,
      }}
    >
      {items.map((item, idx) => (
        <StripSegment
          key={item.label}
          item={item}
          position={idx}
          total={items.length}
          isHero={idx === 0}
          layout={layout}
        />
      ))}
    </View>
  );
}
