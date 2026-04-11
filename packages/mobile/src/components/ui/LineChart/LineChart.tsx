import type { ReactElement } from "react";
import { View } from "react-native";
import { LineChart as GiftedLineChart } from "react-native-gifted-charts";
import type { LineChartProps, ChartThemeValues } from "./LineChart.types";

interface LineChartPresenterProps extends LineChartProps {
  theme: ChartThemeValues;
}

/**
 * Presentational LineChart component with theme-derived styling.
 * Wraps react-native-gifted-charts with semantic theme tokens.
 * @param props - Chart props including data, dimensions, and theme values.
 * @param props.data - Primary data series.
 * @param props.secondaryData - Optional secondary data series.
 * @param props.width - Chart width in pixels.
 * @param props.height - Chart height in pixels.
 * @param props.areaChart - Render as area chart.
 * @param props.showDataPoints - Show data point markers.
 * @param props.hideRules - Hide grid rules.
 * @param props.testID - Test identifier.
 * @param props.theme - Theme values for styling.
 * @returns Line chart element with themed styling.
 */
export function LineChartPresenter({
  data,
  secondaryData,
  width,
  height = 200,
  areaChart = false,
  showDataPoints = true,
  hideRules = false,
  testID,
  theme,
}: LineChartPresenterProps): ReactElement {
  const areaProps = areaChart
    ? {
        areaChart: true,
        startFillColor: theme.lineColor,
        endFillColor: theme.lineColor,
        startOpacity: theme.areaFillStartOpacity,
        endOpacity: theme.areaFillEndOpacity,
      }
    : {};

  return (
    <View testID={testID}>
      <GiftedLineChart
        data={data}
        data2={secondaryData}
        width={width}
        height={height}
        // Line styling
        color={theme.lineColor}
        color2={theme.secondaryLineColor}
        thickness={theme.thickness}
        curved={theme.curved}
        // Data points
        hideDataPoints={!showDataPoints}
        dataPointsColor={theme.lineColor}
        dataPointsRadius={theme.dataPointsRadius}
        // Background & grid
        backgroundColor={theme.backgroundColor}
        rulesColor={theme.gridColor}
        hideRules={hideRules}
        rulesType="solid"
        // X-Axis
        xAxisColor={theme.gridColor}
        xAxisThickness={1}
        xAxisLabelTextStyle={{
          color: theme.textColor,
          fontSize: 12,
          fontFamily: theme.fontFamily,
        }}
        // Y-Axis
        yAxisColor={theme.gridColor}
        yAxisThickness={1}
        yAxisTextStyle={{
          color: theme.textColor,
          fontSize: 12,
          fontFamily: theme.fontFamily,
        }}
        // Indices/ticks
        showYAxisIndices
        showXAxisIndices
        yAxisIndicesColor={theme.gridColor}
        xAxisIndicesColor={theme.gridColor}
        // Area chart props
        {...areaProps}
      />
    </View>
  );
}
