import {
  deviceStatuses,
  foldAlarmsToStatus,
  statusColorsFromTheme,
  buildPoiOverlay,
} from "./sldStatus";
import { SOLARPUNK } from "../../../../theme/tokens";
import type { ActiveAlarm } from "../../../../data/alarms/useAlarms";
import type { GridModeState } from "../../../../data/grid/useGridMode";

function alarm(
  deviceId: string,
  severity: ActiveAlarm["severity"],
): ActiveAlarm {
  return {
    deviceId,
    deviceDisplayName: deviceId,
    measurementName: "x",
    measurementLabel: "x",
    severity,
    displayValue: "—",
    limitLabel: null,
    ts: new Date().toISOString(),
  };
}

describe("foldAlarmsToStatus", () => {
  it("returns alarm over warn for the same device regardless of order", () => {
    const alarms = [alarm("bess_01", "warn"), alarm("bess_01", "alarm")];
    expect(foldAlarmsToStatus(alarms).bess_01).toBe("alarm");
    expect(foldAlarmsToStatus(alarms.slice().reverse()).bess_01).toBe("alarm");
  });

  it("returns warn when only warns are present", () => {
    expect(foldAlarmsToStatus([alarm("bess_01", "warn")]).bess_01).toBe("warn");
  });

  it("omits devices with no alarms", () => {
    expect(foldAlarmsToStatus([]).bess_01).toBeUndefined();
  });
});

describe("statusColorsFromTheme", () => {
  it("maps every SldNodeStatus to a theme color", () => {
    const colors = statusColorsFromTheme(SOLARPUNK);
    expect(colors.ok).toBe(SOLARPUNK.statusOk);
    expect(colors.warn).toBe(SOLARPUNK.statusWarn);
    expect(colors.alarm).toBe(SOLARPUNK.statusAlarm);
    expect(colors.offline).toBe(SOLARPUNK.statusOffline);
  });
});

describe("buildPoiOverlay", () => {
  const baseGridMode: GridModeState = {
    mode: "GRID",
    islandQualifier: null,
    direction: "IMP",
    netAtMeter: "+142 kW IMPORT",
    netActivePowerW: 142_000,
  };

  it("renders the netAtMeter string straight through", () => {
    expect(buildPoiOverlay(baseGridMode, SOLARPUNK, false).netAtMeter).toBe(
      "+142 kW IMPORT",
    );
  });

  it("uses textSoft and OK token when not islanded or curtailed", () => {
    const overlay = buildPoiOverlay(baseGridMode, SOLARPUNK, false);
    expect(overlay.stateColor).toBe(SOLARPUNK.textSoft);
    expect(overlay.stateToken).toBe("OK");
  });

  it("uses textSoft and ISLAND token when islanded", () => {
    const overlay = buildPoiOverlay(
      { ...baseGridMode, mode: "ISLAND", islandQualifier: "fault" },
      SOLARPUNK,
      false,
    );
    expect(overlay.stateColor).toBe(SOLARPUNK.textSoft);
    expect(overlay.stateToken).toBe("ISLAND");
  });

  it("shows CURTAILED in statusWarn when a DER event is active and not islanded", () => {
    const overlay = buildPoiOverlay(baseGridMode, SOLARPUNK, true);
    expect(overlay.stateToken).toBe("CURTAILED");
    expect(overlay.stateColor).toBe(SOLARPUNK.statusWarn);
  });

  it("ISLAND still wins over CURTAILED when both are true", () => {
    const overlay = buildPoiOverlay(
      { ...baseGridMode, mode: "ISLAND", islandQualifier: "fault" },
      SOLARPUNK,
      true,
    );
    expect(overlay.stateToken).toBe("ISLAND");
    expect(overlay.stateColor).toBe(SOLARPUNK.textSoft);
  });
});

describe("deviceStatuses", () => {
  it("is unknown until a device reports, then ok unless alarmed; unprovisioned wins", () => {
    // Arrange
    const devices = {
      meter_01: { provisioned: false },
      bess_01: { provisioned: true },
      cdu_01: {},
      pcs_01: {},
    };
    const reporting = new Set(["bess_01", "cdu_01"]);

    // Act
    const statuses = deviceStatuses(devices, [alarm("bess_01", "warn")], reporting);

    // Assert
    expect(statuses).toEqual({ meter_01: "unprovisioned", bess_01: "warn", cdu_01: "ok", pcs_01: "unknown" });
  });
});

describe("statusColorsFromTheme unprovisioned", () => {
  it("renders unprovisioned in the neutral offline grey", () => {
    // Arrange + Act
    const colors = statusColorsFromTheme(SOLARPUNK);

    // Assert
    expect([colors.unprovisioned, colors.unknown]).toEqual([SOLARPUNK.statusOffline, SOLARPUNK.statusOffline]);
  });
});
