/**
 * NavigationRoot — wires NavigationContainer + AppLayout + Navigator.
 *
 * Lifts the active route name to React state via NavigationContainer's
 * onStateChange so the OUTER chrome (AppLayout) can read it without
 * being a navigator-aware hook user.
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

/**
 * Pull the current route name out of a NavigationState. Stack navigators
 * track a single index; we read that route's name.
 */
function activeNameOf(state: NavigationState | undefined): RouteName | null {
  if (!state) return null;
  const route = state.routes[state.index];
  return (route?.name as RouteName | undefined) ?? null;
}

/**
 * Mount NavigationContainer + Navigator inside AppLayout chrome.
 * @returns Root element ready to render under all the data providers
 */
export function NavigationRoot(): React.ReactElement {
  const navRef = useNavigationContainerRef<RootStackParamList>();
  const [activeName, setActiveName] = useState<RouteName>("Overview");

  return (
    <NavigationContainer
      ref={navRef}
      linking={makeLinking()}
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
