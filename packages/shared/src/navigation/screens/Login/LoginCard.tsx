/**
 * LoginCard — the sign-in card. v1 is sign-in only (be has no reset/activate
 * endpoint — those designer views are deferred to v2 Keycloak). The email
 * field is relabelled Username: be seeds literal operator/viewer usernames.
 *
 * States: idle → submitting → (error | success-via-AuthProvider-flip). On a
 * successful login the AuthProvider flips status to authenticated and AppRoot
 * swaps the gate for the app, so there's no local success view to render.
 */

import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, Easing } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../theme/tokens";
import { RADIUS, SPACE } from "../../../theme/tokens/primitives";
import { useAuth } from "../../../data/auth/useAuth";
import { LoginField } from "./LoginField";

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

interface LoginCardProps {
  /** Deployment label, e.g. "Brookside DC-1". */
  label: string;
  /** Mobile: card goes fluid (maxWidth 360) instead of a fixed 340. */
  fluid?: boolean;
}

export function LoginCard({ label, fluid }: LoginCardProps): React.ReactElement {
  const t = useTheme();
  const isSov = t.name === "sovereign";
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ username?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (): Promise<void> => {
    const next: typeof errors = {};
    if (!username.trim()) next.username = "Username required";
    if (!password) next.password = "Password required";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      // Success: AuthProvider flips to authenticated; AppRoot unmounts this gate.
    } catch (err) {
      setSubmitting(false);
      setErrors({ form: err instanceof Error ? err.message : "Sign-in failed" });
    }
  };

  return (
    <View
      dataSet={{ comp: "LoginCard" }}
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
          Sign in to {label}
        </Text>
      </View>

      <LoginField
        label="Username"
        value={username}
        onChangeText={setUsername}
        placeholder="operator"
        error={errors.username}
        autoFocus
        onSubmitEditing={submit}
      />
      <LoginField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
        error={errors.password ?? errors.form}
        onSubmitEditing={submit}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        disabled={submitting}
        onPress={submit}
        style={{
          minHeight: 40,
          paddingVertical: 11,
          paddingHorizontal: 14,
          borderRadius: RADIUS[2],
          backgroundColor: submitting ? t.borderSoft : t.accent,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: SPACE[2],
        }}
      >
        {submitting ? <Spinner color={t.textSoft} /> : null}
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            {
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.18,
              textTransform: "uppercase",
              color: submitting ? t.textSoft : "#fff",
            },
          ]}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Text>
      </Pressable>

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
        Admin-managed accounts
      </Text>
    </View>
  );
}
