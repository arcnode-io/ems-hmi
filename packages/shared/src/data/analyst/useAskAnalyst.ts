/**
 * useAskAnalyst — hand off from a dispatch surface to the Analyst. Sends a
 * device-scoped arbitrage question (with `focusedDeviceId` context) and
 * navigates to the Analyst screen, where the streamed answer lands.
 *
 * The conversation provider sits above the navigator, so the turn is
 * already in flight by the time the Analyst screen mounts.
 */

import { useCallback } from "react";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { useAnalystConversation } from "./useAnalystConversation";
import type { RootStackParamList } from "../../navigation/routes";

/**
 * The question the hand-off asks — `explain_dispatch`'s sweet spot.
 * Week window, not 24h: on the current demo seed a 24h slice can land
 * mid-charge (no clean discharge-at-peak story), whereas 7d always shows
 * the full arbitrage cycle. Per ems-analyst RESPONSE 2026-09-07.
 */
export function arbitrageQuestion(deviceId: string): string {
  return `Explain ${deviceId}'s dispatch over the last week — how did it track the DAM price, and what did it earn?`;
}

/**
 * @returns `askAnalyst(deviceId)` — fires the question + navigates to Analyst.
 */
export function useAskAnalyst(): (deviceId: string) => void {
  const nav = useNavigation<NavigationProp<RootStackParamList>>();
  const { send } = useAnalystConversation();

  return useCallback(
    (deviceId: string): void => {
      send(arbitrageQuestion(deviceId), { focusedDeviceId: deviceId });
      nav.navigate("Analyst");
    },
    [nav, send],
  );
}
