/**
 * AppLayout — wraps the navigator with the appropriate chrome based on
 * breakpoint. Lives OUTSIDE Stack.Navigator (so chrome doesn't remount on
 * route changes) but INSIDE NavigationContainer.
 *
 * Active route + navigate callback come in as props from NavigationRoot
 * (which listens to NavigationContainer's onStateChange). This avoids
 * useNavigation/useRoute hooks at this layer — they require a Stack ancestor.
 *
 * Phone: TopBar + StatusStrip + screen content + BottomTabs.
 * Desktop: Sidebar + (TopBar + StatusStrip + screen content).
 */

import React from "react";
import { View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useDeploymentIdentity } from "../data/deployment/useDeploymentIdentity";
import { useTopologyView } from "../data/topology/useTopologyView";
import { useFleetKpis } from "../data/kpis/useFleetKpis";
import { useSidebarCollapsed } from "../hooks/useSidebarCollapsed";
import { useGpuFleet } from "../data/compute/useGpuFleet";
import { gpuStripMetrics } from "./screens/Overview/parts/gpuStripMetrics";
import { useAlarmCount } from "../data/alarms/useAlarmCount";
import { useGridMode } from "../data/grid/useGridMode";
import { useOperatingEnvelope } from "../data/grid/useOperatingEnvelope";
import { useDerEventActive } from "../data/grid/useDerEventActive";
import { useDerEventNotice } from "../data/grid/useDerEventNotice";
import { TopBar } from "../components/chrome/TopBar/TopBar";
import { StatusStrip } from "../components/chrome/StatusStrip/StatusStrip";
import { BottomTabs } from "../components/chrome/BottomTabs/BottomTabs";
import { Sidebar } from "../components/chrome/Sidebar/Sidebar";
import { gridSegment } from "./gridSegment";
import {
  routeByName,
  nameBySidebar,
  nameByBottomTab,
  type RouteName,
} from "./routes";

export interface AppLayoutProps {
  activeName: RouteName;
  onNavigate: (name: RouteName) => void;
  children: React.ReactNode;
}

/**
 * Render chrome around the navigator's children.
 * @param props activeName + onNavigate + children
 * @param props.activeName Currently active route name (lifted from navigator state)
 * @param props.onNavigate Callback to dispatch navigation to a new route
 * @param props.children Stack.Navigator (renders the active screen)
 * @returns View element wrapping chrome + children
 */
export function AppLayout({
  activeName,
  onNavigate,
  children,
}: AppLayoutProps): React.ReactElement {
  const t = useTheme();
  const { layout } = useBreakpoint();
  const identity = useDeploymentIdentity();
  const topology = useTopologyView();

  const activeSpec = routeByName(activeName);
  const emsMode = topology.view?.ems_mode ?? "sim";
  const kpis = useFleetKpis();
  const sidebar = useSidebarCollapsed();
  const gpuFleet = useGpuFleet();
  const gridMode = useGridMode();
  const envelope = useOperatingEnvelope();
  const derCurtailed = useDerEventActive();
  const derNotice = useDerEventNotice();
  // Reason: handoff-auto-mode-dispatch-notification-2026-09-22.md — an
  // AUTO-mode DER event has zero operator gate, so it needs the same
  // attention-getting badge as an alarm. Folds into the existing bell/
  // nav-badge count rather than a new component; clears once the operator
  // actually visits the Grid screen (GridScreen calls markSeen()).
  const alarmCount = useAlarmCount() + (derNotice.unseen ? 1 : 0);

  const fmtPct = (v: number | null): string =>
    v === null ? "—" : `${Math.round(v)}%`;
  const siteColor =
    kpis.site.label === "Nominal"
      ? t.statusOk
      : kpis.site.label === "Warn"
        ? t.statusWarn
        : t.statusAlarm;

  const statusItems = [
    { label: "SITE", value: kpis.site.label, color: siteColor, dot: true },
    {
      label: "FLEET SoC",
      value: fmtPct(kpis.fleetSoc.value),
      color: t.colorBess,
    },
    {
      // Reason: no GPU utilization source in the catalog yet (handoff to ICS +
      // power-engineer); throttle count is live and is the demo's point anyway.
      label: "GPU THROTTLE",
      value: gpuStripMetrics(gpuFleet).throttling.value,
      color: gpuFleet.throttlingCount > 0 ? t.statusWarn : t.colorCompute,
    },
    {
      label: "GRID",
      color: t.colorGrid,
      ...gridSegment({
        mode: gridMode.mode,
        direction: gridMode.direction,
        curtailed: derCurtailed,
        importHeadroomW: envelope.importHeadroomW,
        exportHeadroomW: envelope.exportHeadroomW,
        netPowerKw: kpis.grid.powerKw,
        netLabel: kpis.grid.label,
        frequencyHz: kpis.grid.frequencyHz,
      }),
    },
    // TODO: PUE · 24h needs timeseries history hook
    { label: "PUE · 24h", value: "—", color: t.colorThermal, sub: "24h avg" },
    // TODO: CLOCK needs incident tracking
    { label: "CLOCK", value: "T+00:00", color: t.textMid, sub: "since last incident" },
  ];

  const breadcrumbs = (() => {
    if (activeName === "Sld") return [identity.name, "SLD"];
    if (activeName === "DeviceDetail") return [identity.name, "Devices"];
    return [identity.name, activeName];
  })();

  if (layout === "desktop") {
    return (
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          backgroundColor: t.bg,
        }}
      >
        <Sidebar
          route={activeSpec.sidebar}
          collapsed={sidebar.collapsed}
          onToggleCollapsed={sidebar.toggle}
          deploymentName={identity.name}
          deploymentHost={identity.host}
          badges={{ "/modules": alarmCount }}
          user={{
            initials: "RM",
            name: "R. Marquez",
            role: "Lead operator",
          }}
          onNavigate={(path): void => onNavigate(nameBySidebar(path))}
        />
        <View style={{ flex: 1, flexDirection: "column" }}>
          <TopBar
            deploymentName={identity.name}
            mode={emsMode}
            alarmCount={alarmCount}
            userInitials="RM"
            breadcrumbs={breadcrumbs}
            onUserPress={(): void => onNavigate("Settings")}
          />
          <StatusStrip items={statusItems} />
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <TopBar
        deploymentName={identity.name}
        subtitle={breadcrumbs[breadcrumbs.length - 1]}
        mode={emsMode}
        alarmCount={alarmCount}
        userInitials="RM"
        onUserPress={(): void => onNavigate("Settings")}
      />
      <StatusStrip items={statusItems} />
      <View style={{ flex: 1 }}>{children}</View>
      {activeSpec.bottomTab ? (
        <BottomTabs
          active={activeSpec.bottomTab}
          badges={{ modules: alarmCount }}
          onSelect={(tab): void => onNavigate(nameByBottomTab(tab))}
        />
      ) : null}
    </View>
  );
}
