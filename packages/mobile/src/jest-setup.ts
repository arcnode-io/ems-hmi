/**
 * Jest setup — minimal mobile RN compat. Mocks config + gifted-charts.
 */

import { cleanup } from "@testing-library/react-native";
import * as mockGiftedCharts from "../tests/fixtures/react-native-gifted-charts";

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

jest.mock("react-native-gifted-charts", () => mockGiftedCharts);

afterEach(() => {
  cleanup();
});
