/** Single data point for the line chart. */
export interface LineDataItem {
  value: number;
  label?: string;
  dataPointText?: string;
  dataPointColor?: string;
}

/** Theme-derived styling values for charts. */
export interface ChartThemeValues {
  lineColor: string;
  secondaryLineColor: string;
  accentLineColor: string;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  fontFamily: string;
  curved: boolean;
  thickness: number;
  dataPointsRadius: number;
  dataPointsBorderWidth: number;
  dataPointsBorderColor: string;
  areaFillStartOpacity: number;
  areaFillEndOpacity: number;
}

/** Props for the presentational LineChart component. */
export interface LineChartProps {
  data: LineDataItem[];
  secondaryData?: LineDataItem[];
  width?: number;
  height?: number;
  areaChart?: boolean;
  showDataPoints?: boolean;
  hideRules?: boolean;
  testID?: string;
}

/** Props for the LineChart container component. */
export interface LineChartContainerProps extends LineChartProps {
  /** Override theme values if needed */
  themeOverrides?: Partial<ChartThemeValues>;
}
