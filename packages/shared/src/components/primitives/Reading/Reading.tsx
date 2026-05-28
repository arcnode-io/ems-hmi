/**
 * Reading — numeric float measurement with unit suffix. Tier-0 primitive.
 * Maps AsyncAPI `type: float`. See design-handoff/02-components/Reading.md.
 *
 * Behavior:
 *  - `value === null` renders `"—"` in textMid (Rule 3.4 — never "0").
 *  - `tone="warn"|"alarm"` overrides color for fault display.
 *  - `variant` selects type-ramp role (body/bodyDense/kpiValue/display/body).
 */

import React from "react";
import { Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type TypeRole } from "../../../theme/tokens";

export type ReadingVariant = "body" | "dense" | "kpi" | "hero" | "table";
export type ReadingTone = "normal" | "warn" | "alarm";

export interface ReadingProps {
  value: number | null;
  unit: string;
  variant?: ReadingVariant;
  tone?: ReadingTone;
}

/**
 * Map variant prop to type-ramp role. `table` reuses bodyDense for tabular numerics.
 */
const VARIANT_TO_ROLE: Record<ReadingVariant, TypeRole> = {
  body: "body",
  dense: "bodyDense",
  kpi: "kpiValue",
  hero: "display",
  table: "bodyDense",
};

/**
 * Format a finite number with at most one decimal place and locale-grouped thousands.
 * `null` → em-dash.
 * @param value Numeric value or null for no-data
 * @returns String for display
 */
function formatValue(value: number | null): string {
  if (value === null) return "—";
  const rounded = Math.round(value * 10) / 10;
  return rounded.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

/**
 * Render a measurement value + unit suffix.
 * @param props Reading props
 * @returns Text element
 */
export function Reading({
  value,
  unit,
  variant = "body",
  tone = "normal",
}: ReadingProps): React.ReactElement {
  const t = useTheme();
  const role = VARIANT_TO_ROLE[variant];
  const isNoData = value === null;

  const color = match([tone, isNoData] as const)
    .when(([, noData]) => noData, () => t.textMid)
    .with(["warn", false], () => t.statusWarn)
    .with(["alarm", false], () => t.statusAlarm)
    .otherwise(() => t.text);

  return (
    <Text
      dataSet={{
        comp: "Reading",
        state: isNoData ? "no-data" : "normal",
        variant,
      }}
      style={[resolveTypeStyle(t, role), { color }]}
    >
      {formatValue(value)}
      {!isNoData && (
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { color: t.textMid },
          ]}
        >
          {" "}
          {unit}
        </Text>
      )}
    </Text>
  );
}
