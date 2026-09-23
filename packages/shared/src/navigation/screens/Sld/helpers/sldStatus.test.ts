import {
  foldAlarmsToStatus,
  statusColorsFromTheme,
  buildPoiOverlay,
} from "./sldStatus";
import { SOLARPUNK } from "../../../../theme/tokens";
import type { ActiveAlarm } from "../../../../data/alarms/useAlarms";
import type { OperatingEnvelope } from "../../../../data/envelope/useOperatingEnvelope";

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
  const baseEnvelope: OperatingEnvelope = {
    mode: "GRID",
    islandQualifier: null,
    doeState: "ok",
    direction: "IMP",
    headroom: "3.2 MW",
    counterHeadroom: "—",
    usedFraction: 0.4,
    settlement: "+142 kW IMPORT",
    importLimitKw: 5000,
    exportLimitKw: 0,
    netActivePowerW: 142_000,
  };

  it("renders the settlement string straight through", () => {
    expect(buildPoiOverlay(baseEnvelope, SOLARPUNK, false).settlement).toBe(
      "+142 kW IMPORT",
    );
  });

  it("uses textSoft for ok + island states", () => {
    expect(
      buildPoiOverlay({ ...baseEnvelope, doeState: "ok" }, SOLARPUNK, false)
        .stateColor,
    ).toBe(SOLARPUNK.textSoft);
    expect(
      buildPoiOverlay({ ...baseEnvelope, doeState: "island" }, SOLARPUNK, false)
        .stateColor,
    ).toBe(SOLARPUNK.textSoft);
  });

  it("elevates stale to statusWarn and invalid/comm-fail to statusAlarm", () => {
    expect(
      buildPoiOverlay({ ...baseEnvelope, doeState: "stale" }, SOLARPUNK, false)
        .stateColor,
    ).toBe(SOLARPUNK.statusWarn);
    expect(
      buildPoiOverlay({ ...baseEnvelope, doeState: "invalid" }, SOLARPUNK, false)
        .stateColor,
    ).toBe(SOLARPUNK.statusAlarm);
    expect(
      buildPoiOverlay({ ...baseEnvelope, doeState: "comm-fail" }, SOLARPUNK, false)
        .stateColor,
    ).toBe(SOLARPUNK.statusAlarm);
  });

  it("maps doeState to the uppercase token label", () => {
    expect(
      buildPoiOverlay({ ...baseEnvelope, doeState: "comm-fail" }, SOLARPUNK, false)
        .stateToken,
    ).toBe("COMM FAIL");
    expect(
      buildPoiOverlay({ ...baseEnvelope, doeState: "island" }, SOLARPUNK, false)
        .stateToken,
    ).toBe("ISLAND");
  });

  it("shows CURTAILED in statusWarn when a DER event is active and not islanded", () => {
    const overlay = buildPoiOverlay(
      { ...baseEnvelope, doeState: "ok" },
      SOLARPUNK,
      true,
    );
    expect(overlay.stateToken).toBe("CURTAILED");
    expect(overlay.stateColor).toBe(SOLARPUNK.statusWarn);
  });

  it("ISLAND still wins over CURTAILED when both are true", () => {
    const overlay = buildPoiOverlay(
      { ...baseEnvelope, doeState: "island" },
      SOLARPUNK,
      true,
    );
    expect(overlay.stateToken).toBe("ISLAND");
    expect(overlay.stateColor).toBe(SOLARPUNK.textSoft);
  });
});
