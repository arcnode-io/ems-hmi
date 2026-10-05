/**
 * useSidebarCollapsed — desktop sidebar rail state (220 px ↔ 56 px icon rail),
 * remembered per browser so a collapsed layout survives reloads (e.g. while
 * screen-recording). A per-viewer convenience, so local storage is fine.
 */

import { useCallback, useEffect, useState } from "react";
import { kv } from "../data/storage/persisted";

export const SIDEBAR_COLLAPSED_KEY = "ems.sidebarCollapsed";

/** @returns current collapsed state and a toggle that persists it */
export function useSidebarCollapsed(): { collapsed: boolean; toggle: () => void } {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    let current = true;
    void kv.get(SIDEBAR_COLLAPSED_KEY).then((stored) => {
      if (current && stored === "true") setCollapsed(true);
    });
    return (): void => {
      current = false;
    };
  }, []);
  const toggle = useCallback((): void => {
    setCollapsed((prev) => {
      void kv.set(SIDEBAR_COLLAPSED_KEY, String(!prev));
      return !prev;
    });
  }, []);
  return { collapsed, toggle };
}
