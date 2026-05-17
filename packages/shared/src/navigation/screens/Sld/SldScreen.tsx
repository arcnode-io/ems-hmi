/**
 * SldScreen — `/sld` route. Spatial view of the deployment driven by an
 * edp-api-generated SVG fetched via SldProvider (same lifecycle as the DTM:
 * regenerated whenever the topology changes).
 *
 * Composition: BadgeStrip → ReadOnlyBanner → SldCanvas (pan/zoom).
 * The chrome's TopBar/StatusStrip wraps the screen via AppLayout.
 */

import React from "react";
import { View } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { BadgeStrip } from "./parts/BadgeStrip";
import { ReadOnlyBanner } from "./parts/ReadOnlyBanner";
import { SldCanvas } from "./parts/SldCanvas";

export function SldScreen(): React.ReactElement {
  const t = useTheme();
  return (
    <View
      dataSet={{ comp: "SldScreen" }}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <BadgeStrip />
      <ReadOnlyBanner />
      <SldCanvas />
    </View>
  );
}
