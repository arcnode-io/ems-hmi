/**
 * Tests for ThemeProvider + useTheme + useThemeControl. AAA pattern.
 */

import React from "react";
import { render, act } from "@testing-library/react";
import {
  ThemeProvider,
  useTheme,
  useThemeControl,
  type ThemeMode,
} from "./ThemeProvider";
import type { Theme, ThemeName } from "./tokens";

interface ProbeValue {
  theme: Theme;
  themeName: ThemeName;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

function Probe({ onMount }: { onMount: (v: ProbeValue) => void }): null {
  const theme = useTheme();
  const ctl = useThemeControl();
  const value: ProbeValue = {
    theme,
    themeName: ctl.themeName,
    themeMode: ctl.themeMode,
    setThemeMode: ctl.setThemeMode,
  };
  React.useEffect(() => {
    onMount(value);
  }, [value, onMount]);
  return null;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("ThemeProvider + useTheme", () => {
  it("provides a valid theme by default (follows OS scheme or DEFAULT_THEME)", () => {
    // Arrange
    let captured: ProbeValue | null = null;

    // Act
    render(
      <ThemeProvider>
        <Probe onMount={(v) => (captured = v)} />
      </ThemeProvider>,
    );

    // Assert — without a persisted choice the mode defaults to "system",
    // and the resolved themeName follows the OS color scheme (falling
    // back to DEFAULT_THEME when the platform reports nothing).
    expect(captured).not.toBeNull();
    expect(captured!.themeMode).toBe("system");
    expect(["sovereign", "solarpunk"]).toContain(captured!.themeName);
    expect(captured!.theme.name).toBe(captured!.themeName);
  });

  it("respects initialTheme prop", () => {
    // Arrange
    let captured: ProbeValue | null = null;

    // Act
    render(
      <ThemeProvider initialTheme="solarpunk">
        <Probe onMount={(v) => (captured = v)} />
      </ThemeProvider>,
    );

    // Assert
    expect(captured!.themeName).toBe("solarpunk");
    expect(captured!.theme.name).toBe("solarpunk");
  });

  it("setThemeMode switches theme + persists to localStorage", () => {
    // Arrange
    let captured: ProbeValue | null = null;

    // Act
    render(
      <ThemeProvider>
        <Probe onMount={(v) => (captured = v)} />
      </ThemeProvider>,
    );
    act(() => {
      captured!.setThemeMode("solarpunk");
    });

    // Assert
    expect(captured!.themeName).toBe("solarpunk");
    expect(captured!.themeMode).toBe("solarpunk");
    expect(window.localStorage.getItem("@arcnode/theme")).toBe("solarpunk");
  });

  it("explicit mode is preserved even when it matches OS scheme", () => {
    // Arrange — jsdom reports no color-scheme; useColorScheme returns null
    // which we treat as solarpunk via DEFAULT_THEME. Pinning "solarpunk"
    // explicitly must NOT collapse back to "system".
    let captured: ProbeValue | null = null;

    // Act
    render(
      <ThemeProvider>
        <Probe onMount={(v) => (captured = v)} />
      </ThemeProvider>,
    );
    act(() => {
      captured!.setThemeMode("solarpunk");
    });

    // Assert
    expect(captured!.themeMode).toBe("solarpunk");
    expect(captured!.themeName).toBe("solarpunk");
    expect(window.localStorage.getItem("@arcnode/theme")).toBe("solarpunk");
  });

  it("setThemeMode('system') clears the user override", () => {
    // Arrange
    let captured: ProbeValue | null = null;
    window.localStorage.setItem("@arcnode/theme", "sovereign");

    // Act
    render(
      <ThemeProvider>
        <Probe onMount={(v) => (captured = v)} />
      </ThemeProvider>,
    );
    expect(captured!.themeMode).toBe("sovereign");
    act(() => {
      captured!.setThemeMode("system");
    });

    // Assert
    expect(captured!.themeMode).toBe("system");
    expect(window.localStorage.getItem("@arcnode/theme")).toBe("system");
  });

  it("reflects active theme on <html data-theme> attribute", () => {
    // Arrange
    let captured: ProbeValue | null = null;

    // Act
    render(
      <ThemeProvider initialTheme="solarpunk">
        <Probe onMount={(v) => (captured = v)} />
      </ThemeProvider>,
    );

    // Assert
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      "solarpunk",
    );
    expect(captured!.themeName).toBe("solarpunk");
  });

  it("useTheme outside ThemeProvider throws", () => {
    // Arrange — silence React's expected-error logging
    const originalError = console.error;
    console.error = (): void => {};

    // Act / Assert
    expect(() => render(<Probe onMount={(): void => {}} />)).toThrow(
      /useTheme must be used inside/,
    );

    console.error = originalError;
  });

  it("primitive scales are accessible via theme.space / theme.radius / theme.type", () => {
    // Arrange
    let captured: ProbeValue | null = null;

    // Act
    render(
      <ThemeProvider>
        <Probe onMount={(v) => (captured = v)} />
      </ThemeProvider>,
    );

    // Assert
    expect(captured!.theme.space[3]).toBe(12);
    expect(captured!.theme.radius[2]).toBe(4);
    expect(captured!.theme.type.kpiValue.size).toBe(32);
  });
});
