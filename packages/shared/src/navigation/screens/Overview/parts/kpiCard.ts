/** Card shell shared by the Overview KPI tiles (KpiStrip, BessTile, PueTile). */

import type React from "react";
import type { View } from "react-native";
import type { Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";

const CARD_WIDTH = 200;

/** Shared shell for the bespoke Overview KPI tiles. */
export function cardStyle(t: Theme): React.ComponentProps<typeof View>["style"] {
  return {
    width: CARD_WIDTH,
    padding: SPACE[3],
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: RADIUS[3],
    flexShrink: 0,
  };
}
