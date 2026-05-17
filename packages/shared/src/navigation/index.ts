/**
 * Navigation barrel — public surface for App entries.
 *
 * Consumers wrap their data providers with `<NavigationRoot/>` and routes
 * + chrome are taken care of internally.
 */

export { NavigationRoot } from "./NavigationRoot";
export { ROUTES, type RootStackParamList, type RouteName } from "./routes";
