import type { ReactElement } from "react";
import { Navigator as SharedNavigator } from "@ems-hmi/shared";

interface NavigatorProps {
  HomeScreen: () => ReactElement;
  ChatScreen: () => ReactElement;
  SettingsScreen: () => ReactElement;
}

/** URL-based linking config for web (origin + path). */
const LINKING_CONFIG = {
  prefixes: [typeof window !== "undefined" ? window.location.origin : ""],
  config: {
    screens: {
      Home: "",
      Chat: "chat",
      Settings: "settings",
    },
  },
};

/**
 * Web Navigator that wires the shared navigation with URL-based linking.
 * @param props Screen components for each route.
 * @param props.HomeScreen - Home screen component.
 * @param props.ChatScreen - Chat screen component.
 * @param props.SettingsScreen - Settings screen component.
 * @returns Navigator configured for web URL routing.
 */
export function Navigator(props: NavigatorProps): ReactElement {
  return (
    <SharedNavigator
      {...props}
      linking={
        LINKING_CONFIG as Parameters<typeof SharedNavigator>[0]["linking"]
      }
    />
  );
}
