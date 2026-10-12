/**
 * LoginCard — the sign-in card. v1 is sign-in only (be has no reset/activate
 * endpoint — those designer views are deferred to v2 Keycloak). The email
 * field is relabelled Username: be seeds literal operator/viewer usernames.
 *
 * States: idle → submitting → (error | success-via-AuthProvider-flip). On a
 * successful login the AuthProvider flips status to authenticated and AppRoot
 * swaps the gate for the app, so there's no local success view to render.
 */

import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { useAuth } from "../../../data/auth/useAuth";
import { LoginField } from "./LoginField";
import { CardFrame, SubmitButton } from "./CardParts";

/** Public demo credentials a profile ships prefilled (device-demo). */
export interface LoginPrefill {
  username: string;
  password: string;
}

/** Native customer build: the site this card signs in to, and a way off it. */
export interface LoginSite {
  address: string;
  onChange: () => void;
}

interface LoginCardProps {
  /** Deployment label, e.g. "Brookside DC-1". */
  label: string;
  /** Initial field values; omitted on real deployments. */
  prefill?: LoginPrefill;
  /** Mobile: card goes fluid (maxWidth 360) instead of a fixed 340. */
  fluid?: boolean;
  site?: LoginSite;
}

function SiteRow({ site }: { site: LoginSite }): React.ReactElement {
  const t = useTheme();
  const text = resolveTypeStyle(t, "label");
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text testID="login-site" style={[text, { fontSize: 12, color: t.textMid }]}>
        {site.address}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Change site" onPress={site.onChange}>
        <Text style={[text, { fontSize: 12, color: t.accent, fontWeight: "600" }]}>Change site</Text>
      </Pressable>
    </View>
  );
}

export function LoginCard({ label, fluid, prefill, site }: LoginCardProps): React.ReactElement {
  const { login } = useAuth();
  const [username, setUsername] = useState(prefill?.username ?? "");
  const [password, setPassword] = useState(prefill?.password ?? "");
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
    <CardFrame comp="LoginCard" subtitle={`Sign in to ${label}`} footer="Admin-managed accounts" fluid={fluid}>
      {site === undefined ? null : <SiteRow site={site} />}
      <LoginField
        label="Username"
        testID="login-username"
        value={username}
        onChangeText={setUsername}
        placeholder="operator"
        error={errors.username}
        autoFocus
        onSubmitEditing={submit}
      />
      <LoginField
        label="Password"
        testID="login-password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
        error={errors.password ?? errors.form}
        onSubmitEditing={submit}
      />
      <SubmitButton label="Sign in" busyLabel="Signing in…" busy={submitting} onPress={submit} testID="login-submit" />
    </CardFrame>
  );
}
