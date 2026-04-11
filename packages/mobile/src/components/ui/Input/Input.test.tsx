import { fireEvent, screen } from "@testing-library/react-native";
import { z } from "zod";
import { renderWithTheme } from "../../../test-utils";
import { Input } from "./Input";

describe("Input", () => {
  // Happy path: renders and accepts input
  it("renders with placeholder and handles text input", () => {
    const onChangeText = jest.fn();
    renderWithTheme(
      <Input
        placeholder="Enter text"
        onChangeText={onChangeText}
        testID="test-input"
      />,
    );

    const input = screen.getByTestId("test-input");
    expect(input).toBeTruthy();

    fireEvent.changeText(input, "Hello");
    expect(onChangeText).toHaveBeenCalledWith("Hello");
  });

  // Edge case: validates with Zod schema on blur
  it("shows error when validation fails on blur", () => {
    const emailSchema = z.string().email("Invalid email");
    renderWithTheme(
      <Input
        label="Email"
        schema={emailSchema}
        placeholder="you@example.com"
        testID="email-input"
      />,
    );

    const input = screen.getByTestId("email-input");
    fireEvent.changeText(input, "invalid");
    fireEvent(input, "blur");

    expect(screen.getByText("Invalid email")).toBeTruthy();
  });

  // Failure case: clears error when valid input provided
  it("clears error when input becomes valid", () => {
    const minSchema = z.string().min(3, "Too short");
    renderWithTheme(<Input schema={minSchema} testID="min-input" />);

    const input = screen.getByTestId("min-input");

    // Invalid input
    fireEvent.changeText(input, "ab");
    fireEvent(input, "blur");
    expect(screen.getByText("Too short")).toBeTruthy();

    // Valid input
    fireEvent.changeText(input, "abc");
    fireEvent(input, "blur");
    expect(screen.queryByText("Too short")).toBeNull();
  });
});
