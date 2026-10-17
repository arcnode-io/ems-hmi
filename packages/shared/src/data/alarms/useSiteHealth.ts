/** Live site health — alarm evidence + coverage + commissioning state. */

import { useTopologyView } from "../topology/useTopologyView";
import { useAlarmState } from "./useAlarms";
import { siteHealth, type SiteHealth } from "./siteHealth";

export function useSiteHealth(): SiteHealth {
  const { view } = useTopologyView();
  const { alarms, watched, reporting } = useAlarmState();
  const unprovisioned = view ? Object.values(view.devices).filter((d) => d.provisioned === false).length : 0;
  return siteHealth({ alarms, watched, reporting, unprovisioned });
}
