/**
 * useAlarmCount — convenience wrapper returning just the count of active
 * alarms (any severity). Drives the TopBar bell badge + tab/sidebar badges.
 *
 * Use `useAlarms()` directly when you need the full list (e.g. the alarms
 * panel on the Overview screen).
 */

import { useAlarms } from "./useAlarms";

/**
 * @returns Total count of active alarms across the topology
 */
export function useAlarmCount(): number {
  return useAlarms().length;
}
