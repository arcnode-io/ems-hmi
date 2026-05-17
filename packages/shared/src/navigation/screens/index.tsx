/**
 * Stub screens, one per route. Each is a thin wrapper around PlaceholderScreen
 * with the route's label baked in. Replace one file at a time as real screens
 * land.
 */

import type { ReactElement } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../routes";
import { PlaceholderScreen } from "./PlaceholderScreen";
import { OverviewScreen as RealOverviewScreen } from "./Overview/OverviewScreen";
import { ModulesScreen as RealModulesScreen } from "./Modules/ModulesScreen";
import { SldScreen as RealSldScreen } from "./Sld/SldScreen";
import { EnergyScreen as RealEnergyScreen } from "./Energy/EnergyScreen";
import { AnalystScreen as RealAnalystScreen } from "./Analyst/AnalystScreen";
import { ComputeScreen as RealComputeScreen } from "./Compute/ComputeScreen";
import { SettingsScreen as RealSettingsScreen } from "./Settings/SettingsScreen";

export function OverviewScreen(): ReactElement {
  return <RealOverviewScreen />;
}

export function ModulesScreen(): ReactElement {
  return <RealModulesScreen />;
}

export function SldScreen(): ReactElement {
  return <RealSldScreen />;
}

export function EnergyScreen(): ReactElement {
  return <RealEnergyScreen />;
}

export function ComputeScreen(): ReactElement {
  return <RealComputeScreen />;
}

export function AnalystScreen(): ReactElement {
  return <RealAnalystScreen />;
}

export function SettingsScreen(): ReactElement {
  return <RealSettingsScreen />;
}

export function DeviceDetailScreen({
  route,
}: NativeStackScreenProps<RootStackParamList, "DeviceDetail">): ReactElement {
  return (
    <PlaceholderScreen
      label="Device Detail"
      detail={`device_id: ${route.params.deviceId}`}
    />
  );
}
