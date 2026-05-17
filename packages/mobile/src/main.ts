/**
 * RN entry — registers the App with React Native's AppRegistry under the
 * name from app.json. Wraps in ThemeProvider so every screen has theme access.
 */

import { AppRegistry } from "react-native";
import React from "react";
import App from "./App";
import { ThemeProvider } from "@ems-hmi/shared/theme/ThemeProvider";
import { name as appName } from "../app.json";
import { loadConfig } from "./config";

const cfg = loadConfig();
// eslint-disable-next-line no-console
console.info(`Running with config: ${JSON.stringify(cfg)}`);

const AppWithTheme = (): React.ReactElement =>
  React.createElement(ThemeProvider, null, React.createElement(App));

AppRegistry.registerComponent(appName, () => AppWithTheme);
