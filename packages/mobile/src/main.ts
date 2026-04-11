/**
 * @format
 */

import { AppRegistry } from "react-native";
import React from "react";
import App from "./App";
import { TamaguiThemeProvider } from "./theme/TamaguiThemeProvider";
import { name as appName } from "../app.json";
import { loadConfig } from "./config";

const cfg = loadConfig();
console.info(`Running with config: ${JSON.stringify(cfg)}`);

const AppWithTheme = (): React.ReactElement =>
  React.createElement(TamaguiThemeProvider, null, React.createElement(App));

AppRegistry.registerComponent(appName, () => AppWithTheme);
