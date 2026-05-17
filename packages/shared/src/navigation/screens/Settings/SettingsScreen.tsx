/**
 * SettingsScreen — `/settings`. Connection / Account / Display / About.
 *
 * Per /tmp/settings-screen.jsx handoff: platform-aware ConnectionPanel
 * (Android editable Host/IP vs Web read-only endpoint). Units rows
 * appear only when withUnits is true — today they're shown on web
 * because that's the build target we ship first.
 *
 * Reached via the chrome user-footer (desktop) or TopBar avatar (phone) —
 * the screen renders without its own top-bar since AppLayout already
 * wraps it.
 */

import React from "react";
import { Platform, ScrollView, View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import { ConnectionPanel } from "./parts/ConnectionPanel";
import { AccountSection } from "./parts/AccountSection";
import { DisplaySection } from "./parts/DisplaySection";
import { AboutSection } from "./parts/AboutSection";

export function SettingsScreen(): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  const isWeb = Platform.OS === "web";
  return (
    <ScrollView
      dataSet={{ comp: "SettingsScreen" }}
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingBottom: SPACE[5] }}
    >
      <View
        style={{
          marginTop: SPACE[3],
          marginHorizontal: SPACE[4],
          marginBottom: SPACE[2],
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "screenTitle"),
            {
              fontSize: 22,
              color: t.text,
              lineHeight: 22,
              letterSpacing: isSov ? 0.5 : 0,
              ...(isSov ? { textTransform: "uppercase" } : null),
            },
          ]}
        >
          {isSov ? "SETTINGS" : "Settings"}
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "caption"),
            {
              fontSize: 9,
              letterSpacing: 0.2,
              color: t.textSoft,
              textTransform: "uppercase",
              marginTop: 2,
            },
          ]}
        >
          Connection · Account · Display · About
        </Text>
      </View>

      <ConnectionPanel />
      <AccountSection />
      <DisplaySection withUnits={isWeb} />
      <AboutSection />
    </ScrollView>
  );
}
