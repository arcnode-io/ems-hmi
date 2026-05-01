import { styled, View, Text } from "@tamagui/core";

/** Full-height container for the chat screen. */
export const ChatContainer = styled(View, {
  flex: 1,
  backgroundColor: "$background",
});

/** Row wrapper for a single message bubble. */
export const MessageRow = styled(View, {
  paddingHorizontal: "$md",
  paddingVertical: "$xs",

  variants: {
    role: {
      user: { alignItems: "flex-end" },
      assistant: { alignItems: "flex-start" },
    },
  } as const,
});

/** Bubble wrapper for message content. */
export const Bubble = styled(View, {
  maxWidth: "80%",
  padding: "$sm",
  borderRadius: "$sm",
  borderWidth: 1,
  borderColor: "$borderColor",

  variants: {
    role: {
      user: { backgroundColor: "$primary" },
      assistant: { backgroundColor: "$surface" },
    },
  } as const,
});

/** Styled text for message content with role-based color. */
export const BubbleText = styled(Text, {
  fontSize: 15,
  fontFamily: "$body",
  fontWeight: "400",

  variants: {
    role: {
      user: { color: "$background" },
      assistant: { color: "$color" },
    },
  } as const,
});

/** Container for the input row (TextInput + send button). */
export const InputRow = styled(View, {
  flexDirection: "row",
  alignItems: "flex-end",
  padding: "$sm",
  gap: "$xs",
  borderTopWidth: 1,
  borderTopColor: "$borderColor",
  backgroundColor: "$background",
});

/** Error banner at top of chat. */
export const ErrorBanner = styled(View, {
  padding: "$sm",
  backgroundColor: "$error",
  alignItems: "center",
});

/** Error text inside banner. */
export const ErrorText = styled(Text, {
  color: "$background",
  fontSize: 14,
  fontFamily: "$body",
  fontWeight: "500",
});

/** Typing indicator container. */
export const TypingBubble = styled(View, {
  padding: "$sm",
  paddingHorizontal: "$md",
  borderRadius: "$sm",
  backgroundColor: "$surface",
  borderWidth: 1,
  borderColor: "$borderColor",
  alignSelf: "flex-start",
  marginLeft: "$md",
  marginVertical: "$xs",
});
