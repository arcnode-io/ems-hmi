import type { TextInputProps } from "react-native";
import type { ZodString } from "zod";

/**
 * Input component props extending React Native TextInput.
 * Supports self-validation with Zod schema.
 */
export interface InputProps extends Omit<TextInputProps, "style"> {
  /** Label text displayed above input */
  label?: string;
  /** Zod string schema for validation (runs on blur) */
  schema?: ZodString;
  /** When to validate: 'blur' (default) or 'change' */
  validateOn?: "blur" | "change";
  /** Callback with current value and validity */
  onValidate?: (value: string, isValid: boolean) => void;
  /** Test identifier for automation */
  testID?: string;
}
