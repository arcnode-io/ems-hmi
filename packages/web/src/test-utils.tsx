import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { TamaguiThemeProvider } from "./theme/TamaguiThemeProvider";

/**
 * Custom render function that wraps components with TamaguiThemeProvider for testing.
 * @param ui React element to render
 * @returns Testing Library render result
 * @example renderWithTheme(<MyComponent />)
 */
export const renderWithTheme = (
  ui: ReactElement,
): ReturnType<typeof render> => {
  return render(<TamaguiThemeProvider>{ui}</TamaguiThemeProvider>);
};
