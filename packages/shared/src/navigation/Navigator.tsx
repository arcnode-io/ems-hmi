/**
 * Navigator — root stack navigator. Each top-level route is a Stack.Screen.
 * Header is disabled because the chrome (TopBar / Sidebar / BottomTabs) is
 * rendered outside the navigator via AppLayout.
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  OverviewScreen,
  ModulesScreen,
  SldScreen,
  EnergyScreen,
  ComputeScreen,
  AnalystScreen,
  DeviceDetailScreen,
} from "./screens";
import type { RootStackParamList } from "./routes";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * The root stack navigator.
 * @returns Stack.Navigator element with all screens registered
 */
export function Navigator(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="Overview"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Overview" component={OverviewScreen} />
      <Stack.Screen name="Modules" component={ModulesScreen} />
      <Stack.Screen name="Sld" component={SldScreen} />
      <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} />
      <Stack.Screen name="Energy" component={EnergyScreen} />
      <Stack.Screen name="Compute" component={ComputeScreen} />
      <Stack.Screen name="Analyst" component={AnalystScreen} />
    </Stack.Navigator>
  );
}
