/**
 * BottomTabs — phone nav at the bottom of every screen. Five tabs.
 * Mirrors `BottomTabs` in design-handoff/03-screens/overview-screen.jsx.
 *
 * Active tab marked by accent-color top bar + accent label/icon. Inactive
 * tabs use textSoft. Badge appears on tabs with outstanding work (e.g.
 * Modules tab shows alarm count).
 *
 * Touch target ≥ 44px per constitution §6 (WCAG 2.5.5) — each Pressable
 * spans the full segment width × 50px height.
 */

import React from "react";
import { Pressable, View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { usePulseOpacity } from "../../../hooks/usePulseOpacity";
import type { Theme } from "../../../theme/tokens";
import {
  IconOverview,
  IconModules,
  IconEnergy,
  IconCompute,
  IconAnalyst,
} from "../../icons";

export type BottomTabId =
  | "overview"
  | "modules"
  | "energy"
  | "compute"
  | "analyst";

export interface BottomTabsProps {
  active: BottomTabId;
  /** Optional badge counts keyed by tab id. Zero/undefined hides the badge. */
  badges?: Partial<Record<BottomTabId, number>>;
  onSelect: (id: BottomTabId) => void;
}

type IconComp = (props: { size?: number; color?: string }) => React.ReactElement;

interface TabDef {
  id: BottomTabId;
  label: string;
  Icon: IconComp;
}

const TABS: readonly TabDef[] = [
  { id: "overview", label: "Overview", Icon: IconOverview },
  { id: "modules", label: "Modules", Icon: IconModules },
  { id: "energy", label: "Energy", Icon: IconEnergy },
  { id: "compute", label: "Compute", Icon: IconCompute },
  { id: "analyst", label: "Analyst", Icon: IconAnalyst },
] as const;

/**
 * Single tab cell. Pressable spans the full segment so the tap target is the
 * whole strip column, not just the icon.
 */
function Tab({
  tab,
  active,
  badge,
  onPress,
  t,
}: {
  tab: TabDef;
  active: boolean;
  badge: number;
  onPress: () => void;
  t: Theme;
}): React.ReactElement {
  const color = active ? t.accent : t.textSoft;
  // Reason: rule 3.2 — badge breathes while alarms outstanding.
  const badgeOpacity = usePulseOpacity(badge > 0);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      style={{
        flex: 1,
        paddingTop: 8,
        paddingBottom: 6,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        position: "relative",
        // Reason: 50px tall + min flex width gives WCAG 2.5.5 touch target.
        minHeight: 50,
      }}
    >
      {active && (
        <View
          dataSet={{ region: "active-bar" }}
          style={{
            position: "absolute",
            top: 0,
            left: "20%",
            right: "20%",
            height: 2,
            backgroundColor: t.accent,
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
          }}
        />
      )}
      <View style={{ position: "relative" }}>
        <tab.Icon size={20} color={color} />
        {badge > 0 && (
          <View
            dataSet={{ region: "badge" }}
            style={{
              position: "absolute",
              top: -4,
              right: -8,
              minWidth: 14,
              height: 14,
              paddingHorizontal: 3,
              borderRadius: 7,
              backgroundColor: t.statusAlarm,
              borderWidth: 1.5,
              borderColor: t.panel,
              alignItems: "center",
              justifyContent: "center",
              opacity: badgeOpacity,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: t.fontLabel,
                fontSize: 9,
                fontWeight: "700",
              }}
            >
              {badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: t.fontLabel,
          fontSize: 9,
          fontWeight: "600",
          color,
          letterSpacing: 0.15,
          textTransform: "uppercase",
          lineHeight: 10,
        }}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

/**
 * Render the 5-tab bottom nav for phone layouts.
 * @param props active tab + optional badges + onSelect handler
 * @returns View element
 */
export function BottomTabs({
  active,
  badges,
  onSelect,
}: BottomTabsProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      dataSet={{ comp: "BottomTabs" }}
      style={{
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: t.border,
        backgroundColor: t.panel,
        paddingBottom: 4,
      }}
    >
      {TABS.map((tab) => (
        <Tab
          key={tab.id}
          tab={tab}
          active={tab.id === active}
          badge={badges?.[tab.id] ?? 0}
          onPress={(): void => onSelect(tab.id)}
          t={t}
        />
      ))}
    </View>
  );
}
