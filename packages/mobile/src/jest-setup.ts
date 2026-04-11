import React from "react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { cleanup } from "@testing-library/react-native";
import * as mockGiftedCharts from "../tests/fixtures/react-native-gifted-charts";

/** Mock config module — @env is not available in Jest. */
jest.mock("./config", () => ({
  loadConfig: (): Record<string, unknown> => ({
    logLevel: "DEBUG",
    e2e: false,
    mqttUri: "mqtt://localhost:1883",
    fooApiUri: "http://localhost:3000/api",
    chatApiUri: "http://localhost:3000",
  }),
}));

/** Props for mock screen components. */
interface MockScreenProps {
  name?: string;
  component?: ComponentType;
}

/**
 * Mock NavigationContainer renders children directly.
 * @param props - Component props.
 * @param props.children - Child elements to render.
 * @returns Fragment containing children.
 */
const MockNavigationContainer = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => React.createElement(React.Fragment, null, children);

/**
 * Mock useNavigation returns navigate function.
 * @returns Object with navigate mock.
 */
const mockUseNavigation = (): { navigate: jest.Mock } => ({
  navigate: jest.fn(),
});

/**
 * Mock useRoute returns current route.
 * @returns Object with route name.
 */
const mockUseRoute = (): { name: string } => ({ name: "Home" });

jest.mock("@react-navigation/native", () => ({
  NavigationContainer: MockNavigationContainer,
  useNavigation: mockUseNavigation,
  useRoute: mockUseRoute,
}));

/**
 * Mock Navigator renders only the Home screen.
 * @param props - Component props.
 * @param props.children - Screen components.
 * @returns Home screen component or null.
 */
const MockNavigator = ({
  children,
}: {
  children: ReactElement | ReactElement[];
}): ReactElement | null => {
  const screens = React.Children.toArray(
    children,
  ) as ReactElement<MockScreenProps>[];
  const homeScreen = screens.find(
    (child: ReactElement<MockScreenProps>) => child.props.name === "Home",
  );
  if (homeScreen?.props.component) {
    const Component = homeScreen.props.component;
    return React.createElement(Component);
  }
  return null;
};

/**
 * Mock Screen renders its component.
 * @param props - Component props.
 * @param props.component - Screen component to render.
 * @returns Rendered component element.
 */
const MockScreen = ({
  component: Component,
}: {
  component: ComponentType;
}): ReactElement => React.createElement(Component);

/**
 * Mock createNativeStackNavigator returns Navigator and Screen.
 * @returns Object with Navigator and Screen components.
 */
const mockCreateNativeStackNavigator = (): {
  Navigator: typeof MockNavigator;
  Screen: typeof MockScreen;
} => ({
  Navigator: MockNavigator,
  Screen: MockScreen,
});

jest.mock("@react-navigation/native-stack", () => ({
  createNativeStackNavigator: mockCreateNativeStackNavigator,
}));

/**
 * Mock global fetch to prevent real network calls during tests.
 */
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  }),
) as jest.Mock;

/**
 * Mock react-native-gifted-charts - actual chart rendering tested in integration tests.
 * Variable prefixed with 'mock' to satisfy jest.mock scoping rules.
 */
jest.mock("react-native-gifted-charts", () => mockGiftedCharts);

/**
 * Suppress act() warnings in console - these are expected for async hooks in tests.
 */
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]): void => {
    const message = typeof args[0] === "string" ? args[0] : "";
    if (
      message.includes("Warning: An update to") &&
      message.includes("not wrapped in act")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

/**
 * Automatically cleanup after each test to prevent memory leaks and hanging processes.
 */
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});
