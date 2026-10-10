/**
 * OverviewScreen — Tier 8 composition.
 * Layout follows design-handoff/03-screens/overview-screen.jsx (phone) and
 * overview-desktop.jsx (lg+) which renders the same parts in a 3-column
 * scaffold. Phone-first: scrolls vertically, all parts stack.
 *
 * Chrome (TopBar / StatusStrip / Sidebar / BottomTabs) is provided by
 * AppLayout — this component renders the screen body only.
 */

import React from "react";
import { ScrollView, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../routes";
import { useTheme } from "../../../theme/ThemeProvider";
import { SPACE } from "../../../theme/tokens/primitives";
import { useTopologyView } from "../../../data/topology/useTopologyView";
import { useAlarms } from "../../../data/alarms/useAlarms";
import { useGpuFleet } from "../../../data/compute/useGpuFleet";
import { useGridState } from "../../../data/grid/useGridState";
import { isAtLimit, useOperatingEnvelope } from "../../../data/grid/useOperatingEnvelope";
import { CurtailmentBanner } from "../Grid/parts/CurtailmentBanner";
import { HealthBar } from "./parts/HealthBar";
import { GpuClusterStrip } from "./parts/GpuClusterStrip";
import { StrandedCapacity } from "./parts/StrandedCapacity";
import { KpiStrip } from "./parts/KpiStrip";
import { EventHistoryPanel } from "./parts/EventHistoryPanel";
import { PowerBalancePanel } from "./parts/PowerBalancePanel";
import { useFleetKpis } from "../../../data/kpis/useFleetKpis";
import { useCurtailmentPhase } from "../../../data/grid/curtailmentPhase";
import { usePowerBalance } from "../../../data/history/usePowerBalance";
import { useEventHistory } from "../../../data/events/useEventHistory";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function OverviewScreen(): React.ReactElement {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { view } = useTopologyView();
  const alarms = useAlarms();
  const gpuFleet = useGpuFleet();
  const gridState = useGridState();
  const envelope = useOperatingEnvelope();
  const kpis = useFleetKpis();
  const events = useEventHistory();
  const curtailment = useCurtailmentPhase(
    gridState.curtailmentActive,
    envelope.importHeadroomW !== null && isAtLimit(envelope.importHeadroomW),
    gpuFleet.throttlingCount > 0,
  );
  const balance = usePowerBalance({
    gridW: kpis.grid.powerKw === null ? null : kpis.grid.powerKw * 1000,
    bessW: kpis.bess.powerW,
    computeW: kpis.compute.powerW,
  });
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
        {/* Reason: story order — the utility's ask, the balance proving the
            battery covered it and GPU draw held, then the fleet detail. */}
        <CurtailmentBanner phase={curtailment} state={gridState} envelope={envelope} />
        <PowerBalancePanel balance={balance} />
        <GpuClusterStrip fleet={gpuFleet} />
        <KpiStrip gpusCapped={gpuFleet.throttlingCount > 0} />
        <StrandedCapacity fleet={gpuFleet} />
        <EventHistoryPanel
          history={events}
          floorMwh={view?.bess?.reserve_floor_mwh ?? 0}
          onOpenHistory={(): void => nav.navigate("EventHistory")}
        />
      </View>
    </ScrollView>
  );
}
