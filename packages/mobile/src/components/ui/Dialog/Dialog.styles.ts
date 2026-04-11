import { Dialog as TamaguiDialog } from "@tamagui/dialog";
import { styled, View, Text } from "@tamagui/core";

/**
 * Themed dialog overlay with backdrop blur effect.
 * Extends Tamagui Dialog.Overlay with entrance/exit animations.
 */
export const StyledOverlay = styled(TamaguiDialog.Overlay, {
  backgroundColor: "rgba(0,0,0,0.5)",
  opacity: 0.5,
  enterStyle: { opacity: 0 },
  exitStyle: { opacity: 0 },
});

/**
 * Themed dialog content container.
 * Uses theme tokens for background, border, and shadow.
 */
export const StyledContent = styled(TamaguiDialog.Content, {
  backgroundColor: "$surface",
  borderWidth: 2,
  borderColor: "$borderColor",
  borderRadius: "$md",
  padding: "$md",
  minWidth: 280,
  maxWidth: "90%",
  enterStyle: { opacity: 0, scale: 0.95, y: -10 }, // eslint-disable-line id-length
  exitStyle: { opacity: 0, scale: 0.95, y: 10 }, // eslint-disable-line id-length
});

/**
 * Dialog header with title and close button.
 */
export const DialogHeader = styled(View, {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "$sm",
});

/**
 * Close button styled as text.
 */
export const CloseButton = styled(Text, {
  fontSize: 24,
  fontWeight: "400",
  color: "$color",
  paddingHorizontal: "$xs",
  cursor: "pointer",
});
