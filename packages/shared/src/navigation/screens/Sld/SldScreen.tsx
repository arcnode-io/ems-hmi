/**
 * SldScreen — `/sld` route. Spatial view of the deployment laid out
 * client-side from the topology view (`layoutSld` → `SldRenderer`),
 * so arbitrary device counts / topology shapes render correctly.
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
