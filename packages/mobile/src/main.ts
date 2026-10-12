/**
 * RN entry — registers AppRoot with React Native's AppRegistry under the
 * name from app.json. Shares the provider tree + NavigationRoot with web.
 */

import { AppRegistry } from "react-native";
import React from "react";
import { AppRoot } from "@ems-hmi/shared/AppRoot";
import { SiteRoot } from "@ems-hmi/shared/SiteRoot";
import { name as appName } from "../app.json";
import { loadConfig } from "./config";

const cfg = loadConfig();
console.info(`Running with config: ${JSON.stringify(cfg)}`);

// Reason: null = the customer build — the site comes from the address the
// operator enters, so SiteRoot fetches its config before mounting AppRoot.
const Root = (): React.ReactElement | null =>
  cfg === null
    ? React.createElement(SiteRoot)
    : React.createElement(AppRoot, { cfg });

AppRegistry.registerComponent(appName, () => Root);
