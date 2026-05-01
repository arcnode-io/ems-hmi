import type { ReactElement } from "react";
import { useState } from "react";
import { TextInput, View, Text } from "react-native";
import { useCurrentTheme } from "../../../theme";
import type { InputProps } from "./Input.types";
import { styles } from "./Input.styles";

/** Blur event type inferred from TextInputProps for cross-platform compatibility. */
type BlurEvent = Parameters<NonNullable<InputProps["onBlur"]>>[0];

/**
 * Themed text input with self-validation via Zod schema.
 * Uses pure RN components for reliable cross-platform flex behavior.
 * Validates on blur by default, or on change if specified.
 * @param props - Input component props including label, schema, and validation options.
 * @param props.label - Optional label text above input.
 * @param props.schema - Zod schema for validation.
 * @param props.validateOn - When to validate: 'blur' or 'change'.
 * @param props.onValidate - Callback with validation result.
 * @param props.testID - Test identifier for automation.
 * @returns Themed TextInput with validation feedback.
 */
export function Input({
  label,
  schema,
  validateOn = "blur",
  onValidate,
  testID,
  ...textInputProps
}: InputProps): ReactElement {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(textInputProps.defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const theme = useCurrentTheme();

  const validate = (text: string): void => {
    if (schema === undefined) return;

    const result = schema.safeParse(text);
    if (result.success) {
      setError(null);
      onValidate?.(text, true);
    } else {
      const message = result.error.issues[0]?.message ?? "Invalid input";
      setError(message);
      onValidate?.(text, false);
    }
  };

  const handleChangeText = (text: string): void => {
    setValue(text);
    textInputProps.onChangeText?.(text);
    if (validateOn === "change") {
      validate(text);
    }
  };

  const handleBlur = (event: BlurEvent): void => {
    setIsFocused(false);
    textInputProps.onBlur?.(event);
    if (validateOn === "blur") {
      validate(value);
    }
  };

  const getBorderColor = (): string => {
    if (error !== null) return theme.error;
    if (isFocused) return theme.primary;
    return theme.borderColor;
  };

  return (
    <View style={styles.container}>
      {label !== undefined && label !== "" && (
        <Text
          style={[
            styles.label,
            { color: theme.color, fontFamily: theme.fontFamily },
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        {...textInputProps}
        testID={testID}
        value={value}
        onChangeText={handleChangeText}
        onFocus={(ev): void => {
          setIsFocused(true);
          textInputProps.onFocus?.(ev);
        }}
        onBlur={handleBlur}
        placeholderTextColor={theme.colorSecondary}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            color: theme.color,
            fontFamily: theme.fontFamily,
            borderColor: getBorderColor(),
            borderWidth: isFocused
              ? Math.max(theme.inputBorderWidth, 2)
              : theme.inputBorderWidth,
            borderRadius: theme.cardBorderRadius,
          },
        ]}
      />
      {error !== null && (
        <Text
          style={[
            styles.errorText,
            { color: theme.error, fontFamily: theme.fontFamily },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
