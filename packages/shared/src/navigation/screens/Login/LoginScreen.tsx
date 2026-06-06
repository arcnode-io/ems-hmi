/**
 * LoginScreen — the auth gate AppRoot renders (real modes only) until a token
 * exists. Full-viewport Heartbeat backdrop with the sign-in card pinned left on
 * desktop, centred over a legibility scrim on phone. The designer's 720×480
 * frame is the marketing-iframe size; in-app the gate fills the screen.
 */

import React from "react";
import { View, Text } from "react-native";
import { Svg, LinearGradient, Stop, Rect } from "react-native-svg";
import { Defs } from "./backdropShared";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { useDeploymentIdentity } from "../../../data/deployment/useDeploymentIdentity";
import { HeartbeatBackdrop } from "./HeartbeatBackdrop";
import { LoginCard } from "./LoginCard";

/** Vertical legibility scrim behind the phone card (SVG → cross-platform). */
function Scrim({ theme }: { theme: Theme }): React.ReactElement {
  const sov = theme.name === "sovereign";
  const c = sov ? "2,2,2" : "239,230,211";
  const cBot = sov ? "2,2,2" : "220,201,164";
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="login-scrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={`rgb(${c})`} stopOpacity="0.30" />
            <Stop offset="0.42" stopColor={`rgb(${c})`} stopOpacity={sov ? "0.62" : "0.70"} />
            <Stop offset="1" stopColor={`rgb(${cBot})`} stopOpacity={sov ? "0.40" : "0.42"} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#login-scrim)" />
      </Svg>
    </View>
  );
}

function Backdrop({ theme }: { theme: Theme }): React.ReactElement {
  return (
    <View style={{ position: "absolute", inset: 0, overflow: "hidden" }} pointerEvents="none">
      <HeartbeatBackdrop theme={theme} />
    </View>
  );
}

export function LoginScreen(): React.ReactElement {
  const t = useTheme();
  const isDesktop = useBreakpoint().layout === "desktop";
  const label = useDeploymentIdentity().name;

  if (isDesktop) {
    return (
      <View dataSet={{ comp: "LoginScreen" }} style={{ flex: 1, backgroundColor: t.bg }}>
        <Backdrop theme={t} />
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingLeft: 64 }}>
          <LoginCard label={label} />
        </View>
      </View>
    );
  }

  return (
    <View
      dataSet={{ comp: "LoginScreen" }}
      style={{ flex: 1, backgroundColor: t.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 }}
    >
      <Backdrop theme={t} />
      <Scrim theme={t} />
      <Text
        style={[
          resolveTypeStyle(t, "cardHeading"),
          {
            fontSize: 13,
            fontWeight: "700",
            letterSpacing: 0.32,
            color: t.textMid,
            textTransform: "uppercase",
            marginBottom: 18,
          },
        ]}
      >
        ARCNODE EMS
      </Text>
      <View style={{ width: "100%", alignItems: "center" }}>
        <LoginCard label={label} fluid />
      </View>
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          { fontSize: 8.5, letterSpacing: 0.18, color: t.textSoft, textTransform: "uppercase", marginTop: SPACE[5] },
        ]}
      >
        v0.7 · {label}
      </Text>
    </View>
  );
}
