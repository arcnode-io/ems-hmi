import type { ComponentType } from "react";
import type { IconProps } from "@tamagui/helpers-icon";
import { Home, MessageCircle, Settings } from "@tamagui/lucide-icons";

/** Route parameter definitions for type-safe navigation. */
export type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
  Settings: undefined;
};

/** Route metadata for drawer menu items. */
export interface RouteConfig {
  name: keyof RootStackParamList;
  title: string;
  icon: ComponentType<IconProps>;
  path: string;
}

/** Application routes with metadata for navigation UI. */
export const ROUTES: readonly RouteConfig[] = [
  { name: "Home", title: "Dashboard", icon: Home, path: "" },
  { name: "Chat", title: "AI Chat", icon: MessageCircle, path: "chat" },
  { name: "Settings", title: "Settings", icon: Settings, path: "settings" },
];

/** Linking configuration for web URL support. */
export const LINKING_CONFIG = {
  prefixes: [typeof window !== "undefined" ? window.location.origin : ""],
  config: {
    screens: {
      Home: "",
      Chat: "chat",
      Settings: "settings",
    },
  },
};
