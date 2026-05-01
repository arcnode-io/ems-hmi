import { useState, useCallback } from "react";
import type { ReactElement } from "react";
import { FlatList, Platform, TextInput } from "react-native";
import type {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";

import { View } from "@tamagui/core";
import { Send } from "@tamagui/lucide-icons";
import { Button } from "../../ui";
import { useCurrentTheme } from "../../../theme";
import type { ChatMessage } from "./Chat.types";

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  loading: boolean;
  error?: string;
}
import {
  MessageRow,
  Bubble,
  BubbleText,
  InputRow,
  ErrorBanner,
  ErrorText,
  TypingBubble,
} from "./Chat.styles";

/**
 * Chat presenter component with inverted FlatList for auto-scroll.
 * @param props - Chat component props.
 * @param props.messages - Array of chat messages to display.
 * @param props.onSendMessage - Callback when user sends a message.
 * @param props.loading - Whether a response is being fetched.
 * @param props.error - Error message to display, if any.
 * @returns Chat UI element.
 */
export function Chat({
  messages,
  onSendMessage,
  loading,
  error,
}: ChatProps): ReactElement {
  const [inputText, setInputText] = useState("");
  const theme = useCurrentTheme();

  const handleSend = useCallback((): void => {
    const trimmed = inputText.trim();
    if (trimmed.length === 0) return;
    onSendMessage(trimmed);
    setInputText("");
  }, [inputText, onSendMessage]);

  // Reason: onSubmitEditing doesn't fire on web — handle Enter key via onKeyPress
  const handleKeyPress = useCallback(
    (event: NativeSyntheticEvent<TextInputKeyPressEventData>): void => {
      if (Platform.OS !== "web" || event.nativeEvent.key !== "Enter") return;
      // Reason: react-native-web passes the native DOM event which has shiftKey
      const domEvent = event as unknown as { shiftKey: boolean };
      if (domEvent.shiftKey) return;
      event.preventDefault();
      handleSend();
    },
    [handleSend],
  );

  // Reason: inverted FlatList needs reversed data for auto-scroll-to-bottom
  const reversedMessages = [...messages].reverse();

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }): ReactElement => (
      <MessageRow role={item.role === "user" ? "user" : "assistant"}>
        <Bubble role={item.role === "user" ? "user" : "assistant"}>
          <BubbleText role={item.role === "user" ? "user" : "assistant"}>
            {item.content}
          </BubbleText>
        </Bubble>
      </MessageRow>
    ),
    [],
  );

  const keyExtractor = useCallback(
    (_item: ChatMessage, index: number): string => `msg-${index}`,
    [],
  );

  const canSend = inputText.trim().length > 0 && !loading;

  return (
    <View flex={1} testID="chat-container">
      {error !== undefined && (
        <ErrorBanner testID="chat-error">
          <ErrorText>{error}</ErrorText>
        </ErrorBanner>
      )}

      <FlatList
        testID="chat-message-list"
        data={reversedMessages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        inverted={true}
        ListHeaderComponent={
          loading ? (
            <TypingBubble testID="chat-loading-indicator">
              <BubbleText role="assistant">...</BubbleText>
            </TypingBubble>
          ) : null
        }
      />

      <InputRow>
        <View flex={1}>
          <TextInput
            testID="chat-input"
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={theme.colorSecondary}
            multiline={true}
            style={{
              fontFamily: theme.fontFamily,
              color: theme.color,
              backgroundColor: theme.surface,
              borderColor: theme.borderColor,
              borderWidth: theme.inputBorderWidth,
              borderRadius: theme.cardBorderRadius,
              padding: 10,
              maxHeight: 100,
              fontSize: 15,
            }}
            onSubmitEditing={handleSend}
            onKeyPress={handleKeyPress}
          />
        </View>
        <View testID="chat-send-button">
          <Button
            onPress={handleSend}
            icon={Send}
            color={canSend ? "primary" : "default"}
            label=""
          />
        </View>
      </InputRow>
    </View>
  );
}
