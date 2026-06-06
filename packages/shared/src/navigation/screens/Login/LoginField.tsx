/**
 * LoginField — labelled text input with focus + error border states.
 * Ports the designer's Field. RN TextInput so it works web + native.
 */

import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { RADIUS, SPACE } from "../../../theme/tokens/primitives";

interface LoginFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}

export function LoginField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  autoFocus,
  onSubmitEditing,
}: LoginFieldProps): React.ReactElement {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? t.statusAlarm : focused ? t.accent : t.border;

  return (
    <View>
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          {
            fontSize: 9,
            fontWeight: "700",
            letterSpacing: 0.2,
            color: error ? t.statusAlarm : t.textSoft,
            textTransform: "uppercase",
            marginBottom: 6,
          },
        ]}
      >
        {label}
      </Text>
      <View
        style={{
          backgroundColor: t.bg,
          borderWidth: 1,
          borderColor,
          borderRadius: RADIUS[2],
          boxShadow: focused ? `0 0 0 3px ${t.accent}22` : undefined,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={t.textSoft}
          secureTextEntry={secureTextEntry}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 11,
            fontFamily: t.fontLabel,
            fontSize: 13,
            color: t.text,
            letterSpacing: secureTextEntry ? 0.3 : 0.02,
          }}
        />
      </View>
      {error ? (
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { fontSize: 9, color: t.statusAlarm, letterSpacing: 0.1, marginTop: SPACE[1] + 1 },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
