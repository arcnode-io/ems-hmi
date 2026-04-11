import { renderWithTheme } from "../../../test-utils";
import { LineChart } from "./LineChart.container";

const SAMPLE_DATA = [{ value: 50 }, { value: 80 }, { value: 65 }];

describe("LineChart", () => {
  // Happy path: renders with data
  it("renders chart with data points", () => {
    const { getByTestId } = renderWithTheme(
      <LineChart data={SAMPLE_DATA} testID="line-chart" />,
    );

    expect(getByTestId("line-chart")).toBeTruthy();
  });

  // Edge case: renders as area chart
  it("renders as area chart when areaChart prop is true", () => {
    const { getByTestId } = renderWithTheme(
      <LineChart data={SAMPLE_DATA} areaChart testID="area-chart" />,
    );

    expect(getByTestId("area-chart")).toBeTruthy();
  });

  // Edge case: renders with theme overrides
  it("accepts theme overrides", () => {
    const { getByTestId } = renderWithTheme(
      <LineChart
        data={SAMPLE_DATA}
        themeOverrides={{ lineColor: "#FF0000" }}
        testID="custom-chart"
      />,
    );

    expect(getByTestId("custom-chart")).toBeTruthy();
  });
});
