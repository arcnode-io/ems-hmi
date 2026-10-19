/**
 * TopBar — the persistent header that wraps every screen.
 *
 * Two variants, picked from useBreakpoint:
 *  - Phone: deployment name + sub-label + SIM/LIVE pill + alarm bell + avatar (compact).
 *  - Desktop: breadcrumb + global search + clock + SIM/LIVE pill + alarm bell (room to breathe).
 *
 * Mirrors `TopBar` (phone) in design-handoff/03-screens/overview-screen.jsx
 * and `DesktopTopBar` in design-handoff/03-screens/desktop-chrome.jsx.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { AlarmBell } from "./AlarmBell";
import type { ThemeName } from "../../../theme/tokens";

export interface TopBarProps {
  /** Site display name, e.g. "Brookside DC-1". */
  deploymentName: string;
  /** Sub-label under the name on phone, or used for breadcrumb tail on desktop. */
  subtitle?: string;
  /** "live" or "sim" — drives the pill color + label. */
  mode: "live" | "sim";
  /** Outstanding alarm count for the bell badge; 0 hides the badge. */
  alarmCount: number;
  /** Initials shown in the avatar circle. */
  userInitials: string;
  /** Optional breadcrumb segments for desktop (e.g. ["Brookside DC-1", "Modules", "SLD"]). */
  breadcrumbs?: string[];
  /** Tap-handler for the avatar (phone settings entry point). */
  onUserPress?: () => void;
  /** Tap-handler for the bell — opens the alarms list. */
  onAlarmsPress?: () => void;
}

const HEADING_FONT_SIZE_PHONE = 20;
const HEADING_FONT_SIZE_DESKTOP = 16;
const AVATAR_DIAMETER = 30;

/**
 * Pick the heading weight + transform per theme. Sovereign uses Bebas Neue
 * uppercase; Solarpunk uses Cormorant Garamond title-case.
 */
function headingStyle(themeName: ThemeName): {
  textTransform: "uppercase" | "none";
  fontWeight: "400" | "500";
  letterSpacing: number;
} {
  const isSov = themeName === "sovereign";
  return {
    textTransform: isSov ? "uppercase" : "none",
    fontWeight: isSov ? "400" : "500",
    letterSpacing: isSov ? 0.5 : 0,
  };
}

/**
 * Render the SIM/LIVE pill that sits in the top-right of TopBar.
 */
function ModePill({
  mode,
  size,
}: {
  mode: "live" | "sim";
  size: "phone" | "desktop";
}): React.ReactElement {
  const t = useTheme();
  const color = mode === "live" ? t.statusOk : t.statusSim;
  const label = mode === "live" ? "Live" : "Sim";
  const padding = size === "phone" ? { px: 7, py: 0 } : { px: 10, py: 4 };
  return (
    <View
      dataSet={{ comp: "TopBar.ModePill", mode }}
      style={{
        height: size === "phone" ? 20 : undefined,
        paddingHorizontal: padding.px,
        paddingVertical: padding.py,
        borderRadius: 4,
        backgroundColor: color + "20",
        borderWidth: 1,
        borderColor: color,
        flexDirection: "row",
        alignItems: "center",
        gap: size === "phone" ? 4 : 6,
      }}
    >
      <View
        style={{
          width: size === "phone" ? 5 : 6,
          height: size === "phone" ? 5 : 6,
          borderRadius: size === "phone" ? 2.5 : 3,
          backgroundColor: color,
        }}
      />
      <Text
        style={{
          fontFamily: t.fontLabel,
          fontSize: size === "phone" ? 9 : 10,
          fontWeight: size === "phone" ? "600" : "700",
          letterSpacing: 0.18,
          color,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * Phone TopBar — name on the left, SIM/LIVE + bell + avatar on the right.
 */
function PhoneTopBar(props: TopBarProps): React.ReactElement {
  const t = useTheme();
  const heading = headingStyle(t.name);
  return (
    <View
      dataSet={{ comp: "TopBar", layout: "phone" }}
      style={{
        paddingHorizontal: t.space[4],
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        backgroundColor: t.bg,
        flexDirection: "row",
        alignItems: "center",
        gap: t.space[3],
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: t.fontHeading,
            fontSize: HEADING_FONT_SIZE_PHONE,
            lineHeight: 23,
            color: t.text,
            ...heading,
          }}
        >
          {props.deploymentName}
        </Text>
        {props.subtitle ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: t.fontLabel,
              fontSize: 9,
              letterSpacing: 0.15,
              color: t.textSoft,
              marginTop: 1,
              textTransform: "uppercase",
            }}
          >
            {props.subtitle}
          </Text>
        ) : null}
      </View>
      <ModePill mode={props.mode} size="phone" />
      <AlarmBell alarmCount={props.alarmCount} onPress={props.onAlarmsPress} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`User menu, ${props.userInitials}`}
        onPress={props.onUserPress}
      >
        <View
          dataSet={{ region: "avatar" }}
          style={{
            width: AVATAR_DIAMETER,
            height: AVATAR_DIAMETER,
            borderRadius: AVATAR_DIAMETER / 2,
            backgroundColor: t.accent,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontFamily: t.fontLabel,
              fontSize: 11,
              fontWeight: "700",
            }}
          >
            {props.userInitials}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Desktop TopBar — breadcrumb left, search center, clock + SIM/LIVE + bell right.
 * Search is visual placeholder; ⌘K wiring happens in a later phase.
 */
function DesktopTopBar(props: TopBarProps): React.ReactElement {
  const t = useTheme();
  const heading = headingStyle(t.name);
  const crumbs = props.breadcrumbs ?? [props.deploymentName];
  return (
    <View
      dataSet={{ comp: "TopBar", layout: "desktop" }}
      style={{
        height: 56,
        paddingHorizontal: t.space[5],
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        backgroundColor: t.bg,
        flexDirection: "row",
        alignItems: "center",
        gap: t.space[4],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          flex: 1,
          minWidth: 0,
        }}
      >
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <React.Fragment key={`${c}-${i}`}>
              {i > 0 && (
                <Text style={{ color: t.textFaint, fontSize: 11 }}>
                  {"›"}
                </Text>
              )}
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: isLast ? t.fontHeading : t.fontLabel,
                  fontSize: isLast ? HEADING_FONT_SIZE_DESKTOP : 11,
                  fontWeight: isLast ? heading.fontWeight : "600",
                  letterSpacing: isLast ? heading.letterSpacing : 0.15,
                  textTransform: isLast
                    ? heading.textTransform
                    : "uppercase",
                  color: isLast ? t.text : t.textSoft,
                }}
              >
                {c}
              </Text>
            </React.Fragment>
          );
        })}
      </View>
      <ModePill mode={props.mode} size="desktop" />
      <AlarmBell alarmCount={props.alarmCount} onPress={props.onAlarmsPress} />
    </View>
  );
}

/**
 * Pick the right variant based on breakpoint.
 * @param props TopBar props
 * @returns Phone or Desktop variant
 */
export function TopBar(props: TopBarProps): React.ReactElement {
  const { layout } = useBreakpoint();
  return layout === "desktop" ? (
    <DesktopTopBar {...props} />
  ) : (
    <PhoneTopBar {...props} />
  );
}
