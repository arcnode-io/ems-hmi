import type { ReactElement, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { styled, View } from "@tamagui/core";

const ScreenBase = styled(View, {
  flex: 1,
  backgroundColor: "$background",
  width: "100%",
  "$platform-web": {
    minHeight: "100vh",
  },
});

interface ScreenWrapperProps {
  children: ReactNode;
}

/**
 * Root wrapper that fills the viewport with theme background.
 * On native: includes KeyboardAvoidingView for proper input handling.
 * On web: simple wrapper with min-height.
 * @param props - Wrapper props with children content.
 * @param props.children - Content to render inside wrapper.
 * @returns Platform-specific screen wrapper element.
 */
export function ScreenWrapper({ children }: ScreenWrapperProps): ReactElement {
  if (Platform.OS === "web") {
    return <ScreenBase>{children}</ScreenBase>;
  }

  return (
    <ScreenBase>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenBase>
  );
}

/**
 * Content container with max width and centering.
 * Platform-agnostic content layout.
 */
export const ContentContainer = styled(View, {
  flex: 1,
  width: "100%",
  maxWidth: 600,
  marginHorizontal: "auto",
  padding: "$md",
});
