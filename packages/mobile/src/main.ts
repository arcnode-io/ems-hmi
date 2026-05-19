/**
 * RN entry — registers AppRoot with React Native's AppRegistry under the
 * name from app.json. Shares the provider tree + NavigationRoot with web.
 */

import { AppRegistry } from "react-native";
import React from "react";
import { AppRoot } from "@ems-hmi/shared/AppRoot";
import { name as appName } from "../app.json";
import { loadConfig } from "./config";

const cfg = loadConfig();
console.info(`Running with config: ${JSON.stringify(cfg)}`);

const Root = (): React.ReactElement => React.createElement(AppRoot, { cfg });

AppRegistry.registerComponent(appName, () => Root);
