/**
 * Sidebar — desktop nav rail. 220px expanded, 56px collapsed.
 * Mirrors `Sidebar` in design-handoff/03-screens/desktop-chrome.jsx.
 *
 * Structure:
 *   - Logo lockup (ARCNODE + EMS · v0.7) — always visible.
 *   - Deployment identity card (accent left-border, site name, hostname) — expanded only.
 *   - Operate section: Overview / Modules / SLD / Energy / Compute / Analyst.
 *   - Admin section: Settings / Audit log (lower priority).
 *   - User footer (avatar + name + role) — accent-circle initials always visible.
 *
 * Active route gets accent left-border + accentFaint bg + accent text/icon.
 * Badges (e.g. Modules: 2 alarms) shown as alarm-colored count chip; collapsed
 * state degenerates to a single corner dot.
 */

import React from "react";
import { Pressable, View, Text, ScrollView } from "react-native";
import { Svg, Path } from "react-native-svg";
import { useTheme } from "../../../theme/ThemeProvider";
import { useDeploymentIdentity } from "../../../data/deployment/useDeploymentIdentity";
import { usePulseOpacity } from "../../../hooks/usePulseOpacity";
import type { Theme } from "../../../theme/tokens";
import {
  IconOverview,
  IconModules,
  IconGrid,
  IconEnergy,
  IconCompute,
  IconAnalyst,
} from "../../icons";

export type SidebarRoute =
  | "/overview"
  | "/modules"
  | "/modules/sld"
  | "/energy"
  | "/compute"
  | "/analyst"
  | "/settings";

export interface SidebarProps {
  /** Current route path — drives the active nav item highlight. */
  route: SidebarRoute;
  /** When true, sidebar collapses to 56px wide (icon-only). */
  collapsed?: boolean;
  /** Site display name shown on the identity card. */
  deploymentName: string;
  /** Hostname / URL fragment shown under the site name. */
  deploymentHost: string;
  /** Outstanding-work badges keyed by route. */
  badges?: Partial<Record<SidebarRoute, number>>;
  /** Authenticated user — shown in footer avatar + name. */
  user: { initials: string; name: string; role: string };
  /** Called when a nav item is tapped. */
  onNavigate: (route: SidebarRoute) => void;
}

const WIDTH_EXPANDED = 220;
const WIDTH_COLLAPSED = 56;

type IconComp = (props: { size?: number; color?: string }) => React.ReactElement;

interface NavItem {
  route: SidebarRoute;
  label: string;
  Icon: IconComp;
  /** Optional pill rendered next to the label (e.g. "NEW" for demo focus). */
  chip?: string;
}

const OPERATE_NAV: readonly NavItem[] = [
  { route: "/overview", label: "Overview", Icon: IconOverview },
  { route: "/modules", label: "Modules", Icon: IconModules },
  { route: "/modules/sld", label: "SLD", Icon: IconGrid },
  { route: "/energy", label: "Energy", Icon: IconEnergy },
  { route: "/compute", label: "Compute", Icon: IconCompute },
  { route: "/analyst", label: "AI Analyst", Icon: IconAnalyst },
] as const;

/**
 * ARCNODE logo glyph — a stylized "A" + chevron. ~16px.
 */
function LogoGlyph({ color }: { color: string }): React.ReactElement {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
      <Path d="M4 18 L12 4 L20 18 M7 14 H17" />
    </Svg>
  );
}

/**
 * Top-of-sidebar logo lockup.
 */
function LogoLockup({
  t,
  collapsed,
}: {
  t: Theme;
  collapsed: boolean;
}): React.ReactElement {
  const isSov = t.name === "sovereign";
  return (
    <View
      dataSet={{ region: "logo" }}
      style={{
        height: 56,
        paddingHorizontal: collapsed ? 0 : t.space[4],
        flexDirection: "row",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: t.radius[2],
          backgroundColor: t.accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LogoGlyph color="#fff" />
      </View>
      {!collapsed && (
        <View style={{ minWidth: 0 }}>
          <Text
            style={{
              fontFamily: t.fontHeading,
              fontSize: 16,
              color: t.text,
              lineHeight: 18,
              textTransform: isSov ? "uppercase" : "none",
              letterSpacing: isSov ? 1.2 : 0,
              fontWeight: isSov ? "400" : "600",
            }}
          >
            ARCNODE
          </Text>
          <Text
            style={{
              fontFamily: t.fontLabel,
              fontSize: 9,
              color: t.textSoft,
              letterSpacing: 0.18,
              textTransform: "uppercase",
              marginTop: 1,
            }}
          >
            EMS · v0.7
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Deployment identity card — only visible in expanded mode.
 */
function DeploymentCard({
  t,
  name,
  host,
}: {
  t: Theme;
  name: string;
  host: string;
}): React.ReactElement {
  return (
    <View
      dataSet={{ region: "deployment-card" }}
      style={{
        marginTop: t.space[3],
        marginHorizontal: t.space[3],
        paddingHorizontal: t.space[3],
        paddingVertical: t.space[2],
        borderLeftWidth: 2,
        borderLeftColor: t.accent,
      }}
    >
      <Text
        style={{
          fontFamily: t.fontLabel,
          fontSize: 8,
          letterSpacing: 0.22,
          color: t.textSoft,
          textTransform: "uppercase",
          fontWeight: "700",
        }}
      >
        Site
      </Text>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: t.fontBody,
          fontSize: 13,
          color: t.text,
          fontWeight: "600",
          marginTop: 2,
          lineHeight: 16,
        }}
      >
        {name}
      </Text>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: t.fontLabel,
          fontSize: 9,
          color: t.textSoft,
          letterSpacing: 0.1,
          marginTop: 2,
        }}
      >
        {host}
      </Text>
    </View>
  );
}

/**
 * Section heading (e.g. "Operate", "Admin").
 */
function SectionLabel({
  t,
  label,
  spaceTop,
}: {
  t: Theme;
  label: string;
  spaceTop: number;
}): React.ReactElement {
  return (
    <Text
      style={{
        fontFamily: t.fontLabel,
        fontSize: 9,
        letterSpacing: 0.2,
        color: t.textSoft,
        textTransform: "uppercase",
        fontWeight: "600",
        paddingTop: spaceTop,
        paddingBottom: t.space[1],
        paddingHorizontal: t.space[3],
      }}
    >
      {label}
    </Text>
  );
}

/**
 * Single nav item.
 */
function NavRow({
  t,
  item,
  active,
  collapsed,
  badge,
  onPress,
}: {
  t: Theme;
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  badge: number;
  onPress: () => void;
}): React.ReactElement {
  const labelColor = active ? t.accent : t.textMid;
  // Reason: rule 3.2 — badges breathe (opacity 0.7↔1.0) while alarms outstanding.
  const badgeOpacity = usePulseOpacity(badge > 0);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
    >
      <View
        dataSet={{ region: "nav-item", route: item.route, active: active ? "true" : "false" }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: collapsed ? 0 : 10,
          paddingTop: 9,
          paddingBottom: 9,
          paddingHorizontal: collapsed ? 0 : t.space[3],
          marginVertical: collapsed ? 2 : 1,
          marginHorizontal: collapsed ? 8 : 0,
          borderRadius: t.radius[2],
          backgroundColor: active ? t.accentFaint : "transparent",
          borderLeftWidth: 2,
          borderLeftColor: active && !collapsed ? t.accent : "transparent",
          paddingLeft: collapsed ? 0 : active ? t.space[3] - 2 : t.space[3],
          justifyContent: collapsed ? "center" : "flex-start",
          position: "relative",
        }}
      >
        <item.Icon size={18} color={labelColor} />
        {!collapsed && (
          <>
            <Text
              style={{
                fontFamily: t.fontBody,
                fontSize: 13,
                fontWeight: active ? "600" : "500",
                color: labelColor,
                flex: 1,
              }}
            >
              {item.label}
            </Text>
            {item.chip ? (
              <View
                dataSet={{ region: "nav-chip" }}
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 4,
                  backgroundColor: t.accent,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: t.fontLabel,
                    fontSize: 8,
                    fontWeight: "700",
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  {item.chip}
                </Text>
              </View>
            ) : null}
            {badge > 0 && (
              <View
                dataSet={{ region: "badge" }}
                style={{
                  minWidth: 18,
                  height: 16,
                  paddingHorizontal: 5,
                  borderRadius: 8,
                  backgroundColor: t.statusAlarm,
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
          </>
        )}
        {collapsed && badge > 0 && (
          <View
            dataSet={{ region: "badge-dot" }}
            style={{
              position: "absolute",
              top: 6,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: t.statusAlarm,
              borderWidth: 1.5,
              borderColor: t.panel,
              opacity: badgeOpacity,
            }}
          />
        )}
      </View>
    </Pressable>
  );
}

/**
 * Footer with user avatar + name + role.
 */
function UserFooter({
  t,
  user,
  collapsed,
  onPress,
}: {
  t: Theme;
  user: { initials: string; name: string; role: string };
  collapsed: boolean;
  onPress?: () => void;
}): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      onPress={onPress}
      dataSet={{ region: "user-footer" }}
      style={{
        borderTopWidth: 1,
        borderTopColor: t.border,
        paddingVertical: collapsed ? 10 : t.space[3],
        paddingHorizontal: collapsed ? 0 : t.space[3],
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        justifyContent: collapsed ? "center" : "flex-start",
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
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
          {user.initials}
        </Text>
      </View>
      {!collapsed && (
        <View style={{ minWidth: 0, flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: t.fontBody,
              fontSize: 12,
              color: t.text,
              fontWeight: "600",
            }}
          >
            {user.name}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: t.fontLabel,
              fontSize: 9,
              color: t.textSoft,
              letterSpacing: 0.15,
              textTransform: "uppercase",
            }}
          >
            {user.role}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/**
 * Top-level Sidebar component.
 * @param props see SidebarProps
 * @returns View element
 */
export function Sidebar({
  route,
  collapsed = false,
  deploymentName,
  deploymentHost,
  badges,
  user,
  onNavigate,
}: SidebarProps): React.ReactElement {
  const t = useTheme();
  const identity = useDeploymentIdentity();
  const nav = identity.mode === "demo"
    ? OPERATE_NAV.map((it) => (it.route === "/analyst" ? { ...it, chip: "NEW" } : it))
    : OPERATE_NAV;
  return (
    <View
      dataSet={{ comp: "Sidebar", collapsed: collapsed ? "true" : "false" }}
      style={{
        width: collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED,
        backgroundColor: t.panel,
        borderRightWidth: 1,
        borderRightColor: t.border,
        flexDirection: "column",
      }}
    >
      <LogoLockup t={t} collapsed={collapsed} />
      {!collapsed && (
        <DeploymentCard t={t} name={deploymentName} host={deploymentHost} />
      )}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: t.space[3],
          paddingHorizontal: collapsed ? 0 : t.space[2],
        }}
      >
        {!collapsed && (
          <SectionLabel t={t} label="Operate" spaceTop={t.space[2]} />
        )}
        {nav.map((item) => (
          <NavRow
            key={item.route}
            t={t}
            item={item}
            active={item.route === route}
            collapsed={collapsed}
            badge={badges?.[item.route] ?? 0}
            onPress={(): void => onNavigate(item.route)}
          />
        ))}
      </ScrollView>
      <UserFooter
        t={t}
        user={user}
        collapsed={collapsed}
        onPress={(): void => onNavigate("/settings")}
      />
    </View>
  );
}
