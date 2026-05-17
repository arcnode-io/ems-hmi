/**
 * App — delegates to NavigationRoot which mounts NavigationContainer +
 * AppLayout + Stack.Navigator. Chrome lives inside AppLayout; routes live
 * inside Navigator. Both read from the data providers wired in main.tsx.
 */

import type { ReactElement } from "react";
import { NavigationRoot } from "@ems-hmi/shared/navigation/NavigationRoot";

/**
 * Root component — renders NavigationRoot.
 * @returns NavigationRoot element
 */
function App(): ReactElement {
  return <NavigationRoot />;
}

export default App;
