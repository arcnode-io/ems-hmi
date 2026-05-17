/**
 * Composer — chat input footer. Single-line TextInput + send button. Honors
 * Enter to submit; Shift+Enter for newline (web only).
 */

import React, { useState, useCallback } from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";

interface ComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
  placeholder?: string;
}

export function Composer({
  disabled,
  onSend,
  placeholder,
}: ComposerProps): React.ReactElement {
  const t = useTheme();
  const [value, setValue] = useState("");

  const submit = useCallback((): void => {
    const trimmed = value.trim();
    if (trimmed === "") return;
    onSend(trimmed);
    setValue("");
  }, [value, onSend]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE[2],
        paddingVertical: SPACE[2],
        paddingHorizontal: SPACE[4],
        borderTopWidth: 1,
        borderTopColor: t.border,
        backgroundColor: t.surface,
      }}
    >
      <TextInput
        value={value}
        onChangeText={setValue}
        editable={!disabled}
        placeholder={placeholder ?? "Ask about devices, alarms, energy…"}
        placeholderTextColor={t.textSoft}
        onSubmitEditing={submit}
        returnKeyType="send"
        style={{
          flex: 1,
          paddingVertical: 8,
          paddingHorizontal: 10,
          fontFamily: t.fontBody,
          fontSize: 13,
          color: t.text,
          backgroundColor: t.bg,
          borderWidth: 1,
          borderColor: t.borderSoft,
          borderRadius: RADIUS[3],
        }}
      />
      <Pressable
        onPress={submit}
        disabled={disabled || value.trim() === ""}
        accessibilityRole="button"
        accessibilityLabel="Send message"
        style={{
          paddingVertical: 9,
          paddingHorizontal: 14,
          borderRadius: RADIUS[3],
          backgroundColor: t.accent,
          opacity: disabled || value.trim() === "" ? 0.5 : 1,
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            {
              color: "#fff",
              fontWeight: "700",
              letterSpacing: 0.15,
              textTransform: "uppercase",
              fontSize: 11,
            },
          ]}
        >
          Send
        </Text>
      </Pressable>
    </View>
  );
}
