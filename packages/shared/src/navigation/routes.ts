/**
 * Route table — single source of truth for screen names, URL paths, and
 * chrome integration (which sidebar / bottom-tab slot the route belongs to).
 *
 * Names are React Navigation route names (PascalCase). Paths are the URL
 * fragments React Navigation's web linking maps to.
 */

import type { SidebarRoute } from "../components/chrome/Sidebar/Sidebar";
import type { BottomTabId } from "../components/chrome/BottomTabs/BottomTabs";

/** Param-list type for the root stack. Each screen declares its own params. */
export type RootStackParamList = {
  Overview: undefined;
  Modules: undefined;
  Sld: undefined;
  DeviceDetail: { deviceId: string };
  Energy: undefined;
  Compute: undefined;
  Analyst: undefined;
  Settings: undefined;
};

export type RouteName = keyof RootStackParamList;

interface RouteSpec {
  /** React Navigation route name. */
  name: RouteName;
  /** URL path for web linking. `:deviceId` etc. for params. */
  path: string;
  /** Which sidebar item highlights when this route is active (desktop). */
  sidebar: SidebarRoute;
  /** Which bottom tab highlights when this route is active (phone). null = no tab. */
  bottomTab: BottomTabId | null;
}

/**
 * Route map. Order matters for default visit / first screen.
 */
export const ROUTES: readonly RouteSpec[] = [
  { name: "Overview", path: "", sidebar: "/overview", bottomTab: "overview" },
  { name: "Modules", path: "modules", sidebar: "/modules", bottomTab: "modules" },
  { name: "Sld", path: "modules/sld", sidebar: "/modules/sld", bottomTab: "modules" },
  { name: "DeviceDetail", path: "devices/:deviceId", sidebar: "/modules", bottomTab: "modules" },
  { name: "Energy", path: "energy", sidebar: "/energy", bottomTab: "energy" },
  { name: "Compute", path: "compute", sidebar: "/compute", bottomTab: "compute" },
  { name: "Analyst", path: "analyst", sidebar: "/analyst", bottomTab: "analyst" },
  { name: "Settings", path: "settings", sidebar: "/settings", bottomTab: null },
] as const;

/** Look up a route spec by name. */
export function routeByName(name: RouteName): RouteSpec {
  const spec = ROUTES.find((r) => r.name === name);
  if (!spec) throw new Error(`unknown route: ${name}`);
  return spec;
}

/** Look up the route name that owns a given sidebar path. */
export function nameBySidebar(path: SidebarRoute): RouteName {
  const spec = ROUTES.find((r) => r.sidebar === path);
  if (!spec) throw new Error(`no route for sidebar path: ${path}`);
  return spec.name;
}

/** Look up the route name that owns a given bottom-tab id. */
export function nameByBottomTab(tab: BottomTabId): RouteName {
  const spec = ROUTES.find((r) => r.bottomTab === tab);
  if (!spec) throw new Error(`no route for bottom tab: ${tab}`);
  return spec.name;
}
