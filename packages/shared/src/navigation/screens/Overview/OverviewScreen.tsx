/**
 * OverviewScreen — Tier 8 composition.
 * Layout follows updated-handoff/03-screens/overview-screen.jsx (phone) and
 * overview-desktop.jsx (lg+) which renders the same parts in a 3-column
 * scaffold. Phone-first: scrolls vertically, all parts stack.
 *
 * Chrome (TopBar / StatusStrip / Sidebar / BottomTabs) is provided by
 * AppLayout — this component renders the screen body only.
 */

import React from "react";
import { ScrollView, View } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { SPACE } from "../../../theme/tokens/primitives";
import { useTopologyView } from "../../../data/topology/useTopologyView";
import { useAlarms } from "../../../data/alarms/useAlarms";
import { HealthBar } from "./parts/HealthBar";
import { GpuClusterStrip } from "./parts/GpuClusterStrip";
import { StrandedCapacity } from "./parts/StrandedCapacity";
import { KpiStrip } from "./parts/KpiStrip";
import { AlarmsPanel } from "./parts/AlarmsPanel";
import { EnergyChart } from "./parts/EnergyChart";

export function OverviewScreen(): React.ReactElement {
  const t = useTheme();
  const { view } = useTopologyView();
  const alarms = useAlarms();
  // Reason: constitution rule 3.15 — operator-owned hardware count.
  // Leaf devices (utility-side feeds, sub-components) are surfaced
  // contextually elsewhere and shouldn't pad this number.
  const moduleCount = view
    ? Object.values(view.devices).filter(
        (d) => view.templates_used[d.template]?.kind === "module",
      ).length
    : 0;
  const warnCount = alarms.filter((a) => a.severity === "warn").length;
  const alarmCount = alarms.filter((a) => a.severity === "alarm").length;
  const accent =
    alarmCount > 0 ? t.statusAlarm : warnCount > 0 ? t.statusWarn : t.statusOk;
  const headline =
    alarmCount > 0
      ? `${alarmCount} active alarm${alarmCount === 1 ? "" : "s"}`
      : warnCount > 0
        ? `${warnCount} active warning${warnCount === 1 ? "" : "s"}`
        : "All systems nominal";
  const detail = `${moduleCount} module${moduleCount === 1 ? "" : "s"} online`;
  return (
    <ScrollView
      dataSet={{ comp: "OverviewScreen" }}
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingBottom: SPACE[2] }}
    >
      <View>
        <HealthBar headline={headline} detail={detail} accentColor={accent} />
        <GpuClusterStrip />
        <StrandedCapacity />
        <KpiStrip />
        <AlarmsPanel />
        <EnergyChart />
      </View>
    </ScrollView>
  );
}
