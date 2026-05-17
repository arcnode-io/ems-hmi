/**
 * Web linking config for React Navigation. The browser address bar reflects
 * the active route via this mapping.
 *
 * On native, linking is a no-op (no URL bar). The shared file is included so
 * web + mobile use the same screen names + route table.
 */

import type { LinkingOptions } from "@react-navigation/native";
import { ROUTES, type RootStackParamList } from "./routes";

/**
 * Resolve the current origin for web; empty string on native.
 */
function originPrefix(): string {
  const g = globalThis as unknown as {
    window?: { location?: { origin?: string } };
  };
  return g.window?.location?.origin ?? "";
}

/**
 * Build the linking config used by NavigationContainer.
 * @returns LinkingOptions for the root stack
 */
export function makeLinking(): LinkingOptions<RootStackParamList> {
  const screens = Object.fromEntries(
    ROUTES.map((r) => [r.name, r.path]),
  ) as Record<keyof RootStackParamList, string>;
  return {
    prefixes: [originPrefix()],
    config: { screens },
  };
}
