import type { ReactElement } from "react";
import { match } from "ts-pattern";
import {
  useCurrentTheme,
  useThemeSwitcher,
  THEME_NAME,
  type ThemeName,
} from "../../../theme";
import { LineChartPresenter } from "./LineChart";
import type {
  LineChartContainerProps,
  ChartThemeValues,
} from "./LineChart.types";

/** Theme-specific configuration for visual styling. */
interface ThemeConfig {
  curved: boolean;
  thickness: number;
  dataPointsRadius: number;
  dataPointsBorderWidth: number;
  dataPointsBorderColor: string;
  areaFillStartOpacity: number;
  areaFillEndOpacity: number;
}

/** Neobrutalism style: bold, high contrast. */
const NEOBRUTALISM_CONFIG: ThemeConfig = {
  curved: false,
  thickness: 3,
  dataPointsRadius: 6,
  dataPointsBorderWidth: 2,
  dataPointsBorderColor: "#000000",
  areaFillStartOpacity: 0.4,
  areaFillEndOpacity: 0.1,
};

/** Soft curved style for modern themes. */
const SOFT_CONFIG: ThemeConfig = {
  curved: true,
  thickness: 2,
  dataPointsRadius: 4,
  dataPointsBorderWidth: 0,
  dataPointsBorderColor: "transparent",
  areaFillStartOpacity: 0.25,
  areaFillEndOpacity: 0,
};

/** Dark mode variant with higher opacity. */
const DARK_CONFIG: ThemeConfig = {
  ...SOFT_CONFIG,
  areaFillStartOpacity: 0.3,
};

/** Neomorphism variant with subtle opacity. */
const NEOMORPHISM_CONFIG: ThemeConfig = {
  ...SOFT_CONFIG,
  areaFillStartOpacity: 0.2,
  areaFillEndOpacity: 0.05,
};

/**
 * Gets theme config using pattern matching.
 * @param themeName - Current theme name.
 * @returns Theme-specific chart config.
 */
const getThemeConfig = (themeName: ThemeName): ThemeConfig =>
  match(themeName)
    .with(THEME_NAME.NEOBRUTALISM, () => NEOBRUTALISM_CONFIG)
    .with(THEME_NAME.DARKMODE, () => DARK_CONFIG)
    .with(THEME_NAME.NEOMORPHISM, () => NEOMORPHISM_CONFIG)
    .with(THEME_NAME.GLASSMORPHISM, THEME_NAME.LIQUIDGLASS, () => SOFT_CONFIG)
    .exhaustive();

/**
 * Extracts chart-specific styling values from the current theme.
 * @returns ChartThemeValues derived from theme with theme-specific variants.
 */
export function useChartTheme(): ChartThemeValues {
  const theme = useCurrentTheme();
  const { theme: themeName } = useThemeSwitcher();
  const config = getThemeConfig(themeName);

  return {
    lineColor: theme.primary,
    secondaryLineColor: theme.secondary,
    accentLineColor: theme.accent,
    backgroundColor: theme.surface,
    textColor: theme.color,
    gridColor: theme.borderColor,
    fontFamily: theme.fontFamily,
    ...config,
  };
}

/**
 * Container component that injects theme values into LineChart.
 * Handles theme integration via useChartTheme hook.
 * @param props - Container props with optional theme overrides.
 * @param props.themeOverrides - Optional overrides for theme values.
 * @returns LineChart presenter with merged theme values.
 */
export function LineChart({
  themeOverrides,
  ...props
}: LineChartContainerProps): ReactElement {
  const theme = useChartTheme();
  const mergedTheme = { ...theme, ...themeOverrides };

  return <LineChartPresenter {...props} theme={mergedTheme} />;
}
