import React from "react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import * as mockGiftedCharts from "../tests/fixtures/react-native-gifted-charts";

/** Mock config module — import.meta.env is not available in Jest. */
jest.mock("./config", () => ({
  loadConfig: (): Record<string, unknown> => ({
    logLevel: "DEBUG",
    e2e: false,
    mqttUri: "mqtt://localhost:1883",
    fooApiUri: "http://localhost:3000/api",
    chatApiUri: "http://localhost:3000",
  }),
}));

/**
 * Jest setup file for web project.
 * Mocks browser APIs not available in jsdom and native modules.
 */

/** Props for mock screen components. */
interface MockScreenProps {
  name?: string;
  component?: ComponentType;
}

// Mock react-native-svg with proper React components to avoid jsdom warnings
const svgMock = (tag: string): React.ComponentType<Record<string, unknown>> => {
  const Component = React.forwardRef<unknown, Record<string, unknown>>(
    (props, ref) => React.createElement(tag, { ...props, ref }),
  );
  Component.displayName = `Mock${tag.charAt(0).toUpperCase()}${tag.slice(1)}`;
  return Component;
};

jest.mock("react-native-svg", () => ({
  Svg: svgMock("svg"),
  Circle: svgMock("circle"),
  Path: svgMock("path"),
  Rect: svgMock("rect"),
  G: svgMock("g"), // eslint-disable-line id-length -- SVG element name
  Line: svgMock("line"),
  Text: svgMock("text"),
  Defs: svgMock("defs"),
  LinearGradient: svgMock("linearGradient"),
  Stop: svgMock("stop"),
  ClipPath: svgMock("clipPath"),
}));

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

// Mock window.matchMedia for Tamagui Select component
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

/**
 * Mock react-native-gifted-charts - actual chart rendering tested in integration tests.
 * Variable prefixed with 'mock' to satisfy jest.mock scoping rules.
 */
jest.mock("react-native-gifted-charts", () => mockGiftedCharts);
