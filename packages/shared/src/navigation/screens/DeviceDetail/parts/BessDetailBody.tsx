/**
 * BessDetailBody — real BESS module detail view, rendered by
 * DeviceDetailScreen when device.template === "bess_module".
 *
 * Deliberately missing vs. the bess-detail-screen.jsx handoff mockup —
 * none of these exist anywhere in the real device catalog (confirmed by
 * reading edp-api/device_templates directly, 2026-09-14), so they're
 * omitted rather than faked:
 *   - State of health (SoH) %
 *   - Exact cycle count (energy_discharged is the real proxy, shown as-is)
 *   - Cell-level voltage histogram (Tesla Megapack's internal BMS data
 *     isn't exposed via the Modbus TCP integration)
 *   - Thermal sensors (coolant in/out, ambient)
 *   - A settable run mode (AUTO/MANUAL/TARGET SoC) — only set_active_power
 *     / set_reactive_power commands exist, which CommandPanel already covers
 *   - 24h SoC history — no historical-telemetry source exists anywhere in
 *     this app yet; shows a real session-scoped trend instead (BessSocTrend)
 */

import React from "react";
import { useBessModuleDetail } from "../../../../data/bess/useBessModuleDetail";
import { useBessRackRoster } from "../../../../data/bess/useBessRackRoster";
import { useBessSocHistory } from "../../../../data/bess/useBessSocHistory";
import { CommandPanel } from "../../../../components/composed/CommandPanel/CommandPanel";
import { BessHeroPanel } from "./BessHeroPanel";
import { BessSocTrend } from "./BessSocTrend";
import { BessRacksPanel } from "./BessRacksPanel";
import { BessAlarmsPanel } from "./BessAlarmsPanel";

interface BessDetailBodyProps {
  deviceId: string;
  deviceDisplayName: string;
}

export function BessDetailBody({ deviceId, deviceDisplayName }: BessDetailBodyProps): React.ReactElement {
  const detail = useBessModuleDetail(deviceId);
  const racks = useBessRackRoster(deviceId);
  const socHistory = useBessSocHistory(deviceId);
  const alarmDeviceIds = [deviceId, ...racks.map((r) => r.id)];

  return (
    <>
      <BessHeroPanel detail={detail} />
      <BessSocTrend samples={socHistory} />
      <BessRacksPanel racks={racks} />
      <BessAlarmsPanel deviceIds={alarmDeviceIds} />
      <CommandPanel deviceId={deviceId} deviceDisplayName={deviceDisplayName} />
    </>
  );
}
