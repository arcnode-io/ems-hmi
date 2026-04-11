# Chart Theme Integration

## Overview

This document outlines how to integrate `react-native-gifted-charts` with the Tamagui theming system so charts automatically adapt to the active theme (neobrutalism, darkmode, neomorphism, glassmorphism, liquidglass).

## Current Theme Architecture

### Token Sources

Theme tokens are defined in DTCG JSON files:

- `src/theme/tokens/base.json` - Shared spacing, fonts, sizes
- `src/theme/tokens/{theme}.json` - Theme-specific colors, shadows

### Available Color Tokens

Each theme provides these semantic colors:
| Token | Usage |
|-------|-------|
| `$color` | Primary text color |
| `$background` | Page background |
| `$surface` | Card/container background |
| `$primary` | Primary accent (buttons, highlights) |
| `$secondary` | Secondary accent |
| `$accent` | Tertiary accent |
| `$borderColor` | Border color |

### Theme Color Palettes

| Theme         | Primary          | Secondary       | Accent           | Background | Surface                |
| ------------- | ---------------- | --------------- | ---------------- | ---------- | ---------------------- |
| neobrutalism  | #FFE500 (yellow) | #00E5FF (cyan)  | #FF0080 (pink)   | #F5F5F0    | #FFFFFF                |
| darkmode      | #00FFD1 (cyan)   | #00FF87 (green) | #06B6D4          | #0F1419    | #1A1F26                |
| neomorphism   | #6B7280 (gray)   | #9CA3AF         | #374151          | #E0E5EC    | #E0E5EC                |
| glassmorphism | #00D4AA (teal)   | #E879F9 (pink)  | #818CF8 (purple) | #F0F9FF    | rgba(255,255,255,0.6)  |
| liquidglass   | #64748B (slate)  | #7DD3FC (blue)  | #A78BFA (purple) | gradient   | rgba(255,255,255,0.85) |

## Chart Component Strategy

### Accessing Theme Values

```tsx
import { useTheme } from "@tamagui/core";

function ChartContainer() {
  const theme = useTheme();

  // Access resolved token values
  const lineColor = theme.primary.val;      // e.g., "#FFE500"
  const bgColor = theme.background.val;     // e.g., "#F5F5F0"
  const textColor = theme.color.val;        // e.g., "#000000"
  const gridColor = theme.borderColor.val;  // e.g., "#000000"

  return <LineChart {...} />;
}
```

### Chart Color Mapping

Map chart elements to semantic theme tokens:

| Chart Element              | Theme Token    | Reason                  |
| -------------------------- | -------------- | ----------------------- |
| Line/bars (primary data)   | `$primary`     | Main visual element     |
| Line/bars (secondary data) | `$secondary`   | Comparison data         |
| Line/bars (tertiary data)  | `$accent`      | Additional series       |
| Axis labels                | `$color`       | Text consistency        |
| Grid lines                 | `$borderColor` | Subtle structural lines |
| Chart background           | `$surface`     | Match card backgrounds  |
| Tooltip background         | `$surface`     | Consistent overlays     |
| Tooltip text               | `$color`       | Text consistency        |

### react-native-gifted-charts Props

Key styling props to theme:

```tsx
<LineChart
  data={data}
  // Line styling
  color={theme.primary.val}
  thickness={2}
  // Data points
  dataPointsColor={theme.primary.val}
  // Background
  backgroundColor={theme.surface.val}
  // Axis labels
  xAxisLabelTextStyle={{ color: theme.color.val }}
  yAxisTextStyle={{ color: theme.color.val }}
  // Grid
  rulesColor={theme.borderColor.val}
  rulesType="solid"
  // Hide default elements if needed
  hideDataPoints={false}
  hideRules={false}
/>
```

### Multi-Series Charts

For charts with multiple data series:

```tsx
const theme = useTheme();

const seriesColors = [
  theme.primary.val, // Series 1
  theme.secondary.val, // Series 2
  theme.accent.val, // Series 3
];

// Or use data with per-point colors
const data = values.map((value, i) => ({
  value,
  color: seriesColors[i % seriesColors.length],
}));
```

## Theme-Specific Considerations

### Neobrutalism

- Use hard edges (no curve smoothing)
- Bold 2-4px line thickness
- Black borders on data points
- High contrast colors

```tsx
{
  curved: false,
  thickness: 3,
  dataPointsRadius: 6,
  dataPointsColor: theme.primary.val,
  dataPointsBorderWidth: 2,
  dataPointsBorderColor: "#000000",
}
```

### Darkmode

- Glow effects on lines (if supported)
- Subtle grid lines
- Ensure sufficient contrast

```tsx
{
  thickness: 2,
  rulesColor: "rgba(255,255,255,0.1)",
}
```

### Neomorphism

- Soft, muted colors
- Avoid harsh contrasts
- Match embossed aesthetic

```tsx
{
  thickness: 2,
  rulesColor: "rgba(0,0,0,0.1)",
  curved: true,
}
```

### Glassmorphism / Liquidglass

- Semi-transparent elements where possible
- Smooth curves
- Subtle gradients if supported

```tsx
{
  curved: true,
  thickness: 2,
  areaChart: true,
  startFillColor: `${theme.primary.val}40`, // 25% opacity
  endFillColor: `${theme.primary.val}00`,   // 0% opacity
}
```

## Implementation Checklist

- [ ] Create `Chart/` component directory with container/presenter pattern
- [ ] Create `useChartTheme()` hook to extract chart-specific values
- [ ] Map all chart colors to theme tokens
- [ ] Add theme-specific variants (curved vs straight, etc.)
- [ ] Test across all 5 themes
- [ ] Ensure dark mode contrast ratios are accessible

## File Structure

```
src/components/ui/Chart/
├── Chart.tsx              # Presentational component
├── Chart.container.tsx    # Data fetching, theme integration
├── Chart.styles.ts        # Any styled wrappers
├── Chart.hooks.ts         # useChartTheme() hook
├── Chart.types.ts         # TypeScript interfaces
└── Chart.test.tsx         # Tests
```

## Example: useChartTheme Hook

```tsx
// Chart.hooks.ts
import { useTheme, useThemeName } from "@tamagui/core";

interface ChartThemeValues {
  lineColor: string;
  secondaryLineColor: string;
  accentLineColor: string;
  backgroundColor: string;
  textColor: string;
  gridColor: string;
  curved: boolean;
  thickness: number;
}

export function useChartTheme(): ChartThemeValues {
  const theme = useTheme();
  const themeName = useThemeName();

  // Theme-specific curve preference
  const curved = themeName !== "neobrutalism";

  // Theme-specific line thickness
  const thickness = themeName === "neobrutalism" ? 3 : 2;

  return {
    lineColor: theme.primary.val,
    secondaryLineColor: theme.secondary.val,
    accentLineColor: theme.accent.val,
    backgroundColor: theme.surface.val,
    textColor: theme.color.val,
    gridColor: theme.borderColor.val,
    curved,
    thickness,
  };
}
```

## References

- [react-native-gifted-charts docs](https://gifted-charts.web.app/)
- Tamagui theme config: `src/theme/tamagui.config.ts`
- Theme tokens: `src/theme/tokens/*.json`
