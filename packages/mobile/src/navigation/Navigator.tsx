import type { ReactElement } from "react";
import { Navigator as SharedNavigator } from "@ems-hmi/shared";

interface NavigatorProps {
  HomeScreen: () => ReactElement;
  ChatScreen: () => ReactElement;
  SettingsScreen: () => ReactElement;
}

/** Deep-link config for mobile (myapp:// scheme). */
const LINKING_CONFIG = {
  prefixes: ["myapp://"],
  config: {
    screens: {
      Home: "",
      Chat: "chat",
      Settings: "settings",
    },
  },
};

/**
 * Mobile Navigator that wires the shared navigation with deep link support.
 * @param props Screen components for each route.
 * @param props.HomeScreen - Home screen component.
 * @param props.ChatScreen - Chat screen component.
 * @param props.SettingsScreen - Settings screen component.
 * @returns Navigator configured for mobile deep linking.
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
