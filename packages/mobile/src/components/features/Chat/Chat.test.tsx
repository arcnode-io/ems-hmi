import { fireEvent, screen } from "@testing-library/react-native";
import { renderWithTheme } from "../../../test-utils";
import { Chat } from "./Chat";
import type { ChatMessage } from "./Chat.types";

const MOCK_MESSAGES: ChatMessage[] = [
  { role: "user", content: "What is the current load?" },
  { role: "assistant", content: "The current load is 450MW." },
];

describe("Chat", () => {
  it("renders user and assistant messages", () => {
    // Arrange & Act
    renderWithTheme(
      <Chat
        messages={MOCK_MESSAGES}
        onSendMessage={jest.fn()}
        loading={false}
      />,
    );

    // Assert
    expect(screen.getByText("What is the current load?")).toBeTruthy();
    expect(screen.getByText("The current load is 450MW.")).toBeTruthy();
  });

  it("shows loading indicator when waiting", () => {
    // Arrange & Act
    renderWithTheme(
      <Chat messages={[]} onSendMessage={jest.fn()} loading={true} />,
    );

    // Assert
    expect(screen.getByTestId("chat-loading-indicator")).toBeTruthy();
  });

  it("calls onSendMessage on send", () => {
    // Arrange
    const onSendMessage = jest.fn();
    renderWithTheme(
      <Chat messages={[]} onSendMessage={onSendMessage} loading={false} />,
    );

    const input = screen.getByTestId("chat-input");

    // Act
    fireEvent.changeText(input, "Hello AI");
    fireEvent(input, "submitEditing");

    // Assert
    expect(onSendMessage).toHaveBeenCalledWith("Hello AI");
  });

  it("shows error banner", () => {
    // Arrange & Act
    renderWithTheme(
      <Chat
        messages={[]}
        onSendMessage={jest.fn()}
        loading={false}
        error="Server unavailable"
      />,
    );

    // Assert
    expect(screen.getByText("Server unavailable")).toBeTruthy();
  });
});
