/**
 * Shared chrome for the gate cards (SiteCard → LoginCard): the card frame
 * with the ARCNODE heading + footer note, and the primary submit button.
 */

import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Easing } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../theme/tokens";
import { RADIUS, SPACE } from "../../../theme/tokens/primitives";

function Spinner({ color }: { color: string }): React.ReactElement {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View
      style={{
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: color,
        borderTopColor: "transparent",
        transform: [{ rotate }],
      }}
    />
  );
}

function cardShadow(t: Theme): string {
  return t.name === "sovereign" ? "0 18px 50px rgba(0,0,0,0.55)" : "0 18px 50px rgba(40,30,18,0.18)";
}

interface CardFrameProps {
  comp: string;
  /** Line under the ARCNODE heading, e.g. "Sign in to Brookside DC-1". */
  subtitle: string;
  footer: string;
  /** Mobile: card goes fluid (maxWidth 360) instead of a fixed 340. */
  fluid?: boolean;
  children: React.ReactNode;
}

export function CardFrame({ comp, subtitle, footer, fluid, children }: CardFrameProps): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  return (
    <View
      dataSet={{ comp }}
      style={{
        width: fluid ? "100%" : 340,
        maxWidth: fluid ? 360 : 340,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        padding: SPACE[5],
        gap: SPACE[4],
        boxShadow: cardShadow(t),
      }}
    >
      <View>
        <Text
          style={{
            fontFamily: t.fontHeading,
            fontSize: 24,
            lineHeight: 26,
            fontWeight: isSov ? "400" : "500",
            letterSpacing: isSov ? 1.2 : 0,
            color: t.text,
            textTransform: isSov ? "uppercase" : "none",
          }}
        >
          ARCNODE
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { fontSize: 9, letterSpacing: 0.22, color: t.textSoft, textTransform: "uppercase", marginTop: SPACE[1] },
          ]}
        >
          {subtitle}
        </Text>
      </View>
      {children}
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          {
            fontSize: 9,
            color: t.textSoft,
            letterSpacing: 0.1,
            textTransform: "uppercase",
            paddingTop: SPACE[2],
            borderTopWidth: 1,
            borderTopColor: t.borderSoft,
          },
        ]}
      >
        {footer}
      </Text>
    </View>
  );
}

interface SubmitButtonProps {
  label: string;
  busyLabel: string;
  busy: boolean;
  onPress: () => void;
  testID: string;
}

export function SubmitButton({ label, busyLabel, busy, onPress, testID }: SubmitButtonProps): React.ReactElement {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      disabled={busy}
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderRadius: RADIUS[2],
        backgroundColor: busy ? t.borderSoft : t.accent,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: SPACE[2],
      }}
    >
      {busy ? <Spinner color={t.textSoft} /> : null}
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          {
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 0.18,
            textTransform: "uppercase",
            color: busy ? t.textSoft : "#fff",
          },
        ]}
      >
        {busy ? busyLabel : label}
      </Text>
    </Pressable>
  );
}
