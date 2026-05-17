/**
 * Indicator — colored dot for binary state. Tier-0 primitive. Maps AsyncAPI `type: bool`.
 * See handoff/02-components/Indicator.md.
 *
 * Color IS the entire signal — no label. For a label + dot, use Mode.
 */

import React from "react";
import { View } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";

export type IndicatorSize = "sm" | "md" | "lg";

export interface IndicatorProps {
  /** `true` = ok, `false` = fault, `null` = no data. */
  state: boolean | null;
  size?: IndicatorSize;
}

/** Dot diameter per size variant. */
const SIZE_PX: Record<IndicatorSize, number> = {
  sm: 8,
  md: 10,
  lg: 14,
};

/**
 * Render a colored dot conveying binary state.
 * @param props Indicator props
 * @returns View element
 */
export function Indicator({
  state,
  size = "md",
}: IndicatorProps): React.ReactElement {
  const t = useTheme();
  const diameter = SIZE_PX[size];

  const dataState = match(state)
    .with(true, () => "ok" as const)
    .with(false, () => "fault" as const)
    .with(null, () => "no-data" as const)
    .exhaustive();

  const color = match(dataState)
    .with("ok", () => t.statusOk)
    .with("fault", () => t.statusAlarm)
    .with("no-data", () => t.textSoft)
    .exhaustive();

  return (
    <View
      dataSet={{ comp: "Indicator", state: dataState, size }}
      style={{
        width: diameter,
        height: diameter,
        borderRadius: diameter / 2,
        backgroundColor: color,
      }}
    />
  );
}
