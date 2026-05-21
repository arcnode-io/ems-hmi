/**
 * SldScreen — `/sld` route. Spatial view of the deployment laid out
 * client-side from the topology view (`layoutSld` → `SldRenderer`),
 * so arbitrary device counts / topology shapes render correctly.
 *
 * Composition: BadgeStrip → ReadOnlyBanner → DispatchBanner → SldCanvas.
 * Device taps navigate to `/devices/:deviceId`.
 */

import React, { useCallback } from "react";
import { View } from "react-native";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { useTheme } from "../../../theme/ThemeProvider";
import { BadgeStrip } from "./parts/BadgeStrip";
import { ReadOnlyBanner } from "./parts/ReadOnlyBanner";
import { SldCanvas } from "./parts/SldCanvas";
import { DispatchBanner } from "../../../components/composed/DispatchBanner/DispatchBanner";
import type { RootStackParamList } from "../../routes";

export function SldScreen(): React.ReactElement {
  const t = useTheme();
  const nav = useNavigation<NavigationProp<RootStackParamList>>();
  const onSelectDevice = useCallback(
    (deviceId: string) => nav.navigate("DeviceDetail", { deviceId }),
    [nav],
  );
  return (
    <View
      dataSet={{ comp: "SldScreen" }}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <BadgeStrip />
      <ReadOnlyBanner />
      <DispatchBanner />
      <SldCanvas onSelectDevice={onSelectDevice} />
    </View>
  );
}
