/**
 * Wires NavigationContainer + AppLayout + Navigator. Lifts the active
 * route name into React state so AppLayout chrome (sidebar/topbar/tabs)
 * can highlight it without being a navigator-aware hook user.
 */

import React, { useState } from "react";
import {
  NavigationContainer,
  useNavigationContainerRef,
  type NavigationState,
} from "@react-navigation/native";
import { AppLayout } from "./AppLayout";
import { Navigator } from "./Navigator";
import { makeLinking } from "./linking";
import type { RootStackParamList, RouteName } from "./routes";

function activeNameOf(state: NavigationState | undefined): RouteName | null {
  if (!state) return null;
  const route = state.routes[state.index];
  return (route?.name as RouteName | undefined) ?? null;
}

export function NavigationRoot(): React.ReactElement {
  const navRef = useNavigationContainerRef<RootStackParamList>();
  const [activeName, setActiveName] = useState<RouteName>("Overview");

  return (
    <NavigationContainer
      ref={navRef}
      linking={makeLinking()}
      // onStateChange fires on subsequent transitions; onReady catches the
      // initial deep-link route so direct loads (/modules, /sld, …) don't
      // leave the chrome stuck on the default route.
      onReady={(): void => {
        const name = navRef.getCurrentRoute()?.name as RouteName | undefined;
        if (name) setActiveName(name);
      }}
      onStateChange={(state): void => {
        const name = activeNameOf(state);
        if (name && name !== activeName) setActiveName(name);
      }}
    >
      <AppLayout
        activeName={activeName}
        onNavigate={(name): void => {
          navRef.navigate(name as never);
        }}
      >
        <Navigator />
      </AppLayout>
    </NavigationContainer>
  );
}
