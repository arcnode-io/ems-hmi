/**
 * Jest setup — minimal RN-Web compat shims.
 *
 * Mocks:
 *  - `./config` — `import.meta.env` doesn't exist in Jest.
 *  - `react-native-svg` — jsdom can't render the real native bundle; we return
 *    plain DOM primitives so structural assertions still work.
 */

import React from "react";
import { TextEncoder, TextDecoder } from "util";

// jsdom omits TextEncoder/TextDecoder; the real browser + RN runtimes provide
// them. RealMqttClient decodes wire payloads with TextDecoder.
Object.assign(globalThis, {
  TextEncoder: globalThis.TextEncoder ?? TextEncoder,
  TextDecoder: globalThis.TextDecoder ?? TextDecoder,
});

jest.mock("./config", () => ({
  loadConfig: (): Record<string, unknown> => ({
    logLevel: "DEBUG",
    e2e: false,
    deploymentName: "Test Site",
    deploymentHost: "test.local",
    mqttUri: "",
    deviceApiUri: "/api",
    chatApiUri: "http://localhost:3000",
    mode: "demo",
  }),
}));

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
  Polygon: svgMock("polygon"),
  Polyline: svgMock("polyline"),
  G: svgMock("g"), // eslint-disable-line id-length -- SVG element name
  Line: svgMock("line"),
  Text: svgMock("text"),
  Defs: svgMock("defs"),
  LinearGradient: svgMock("linearGradient"),
  Stop: svgMock("stop"),
  ClipPath: svgMock("clipPath"),
}));
