/**
 * StrandedCapacity — Overview Zone B'. Power/Runway/Grid headroom.
 * Grid is the operating envelope's import limit in use at the POI (see
 * gridHeadroomRow for the ISLAND / degraded-source rules).
 *
 * Power = GPU fleet draw vs design capacity; Runway = BESS energy above the
 * reserve floor at the current discharge (see headroomRows).
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { useOperatingEnvelope } from "../../../../data/grid/useOperatingEnvelope";
import { useGridMode } from "../../../../data/grid/useGridMode";
import { useTopologyView } from "../../../../data/topology/useTopologyView";
import { useFleetKpis } from "../../../../data/kpis/useFleetKpis";
import type { GpuFleet } from "../../../../data/compute/useGpuFleet";
import { gridHeadroomRow } from "./gridHeadroomRow";
import { constraintSummary, powerRow, runwayRow, type CapacityState } from "./headroomRows";

interface Row {
  label: string;
  /** 0..1 — fraction of envelope used. */
  val: number;
  color: string;
  headline: string;
}

function stateColor(t: Theme, state: CapacityState): string {
  return match(state)
    .with("BALANCED", () => t.statusOk)
    .otherwise(() => t.statusWarn);
}

interface RatioRowProps {
  row: Row;
}

function RatioRow({ row }: RatioRowProps): React.ReactElement {
  const t = useTheme();
  return (
    <View style={{ marginTop: 6 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: SPACE[2],
        }}
      >
        <Text style={[resolveTypeStyle(t, "label"), { color: t.textMid }]}>
          {row.label}
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "label"),
            { color: t.text, fontWeight: "600" },
          ]}
        >
          {row.headline}
        </Text>
      </View>
      <View
        style={{
          marginTop: 4,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: t.borderSoft,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${row.val * 100}%`,
            backgroundColor: row.color,
            borderRadius: 2.5,
          }}
        />
      </View>
    </View>
  );
}

export function StrandedCapacity({ fleet }: { fleet: GpuFleet }): React.ReactElement {
  const t = useTheme();
  const { view } = useTopologyView();
  const kpis = useFleetKpis();
  const envelope = useOperatingEnvelope();
  const gridMode = useGridMode();
  const power = powerRow(fleet.totalDrawW, view?.sizing_params.P_compute_total_kW ?? 0);
  const runway = runwayRow(view?.bess ?? null, kpis.fleetSoc.value, kpis.bess.powerW);
  const grid = gridHeadroomRow(envelope, gridMode.mode === "ISLAND");
  const { state, footer } = constraintSummary([
    { limit: "POWER LIMITED", label: "Power", ratio: power.forState },
    { limit: "RUNWAY LIMITED", label: "Runway", ratio: runway.forState },
    { limit: "GRID LIMITED", label: "Grid", ratio: grid.forState },
  ]);
  const sColor = stateColor(t, state);

  const rows: Row[] = [
    { label: "Power", val: power.val, color: t.colorCompute, headline: power.headline },
    { label: "Runway", val: runway.val, color: t.colorBess, headline: runway.headline },
    { label: "Grid", val: grid.val, color: t.colorGrid, headline: grid.headline },
  ];

  return (
    <View
      dataSet={{ comp: "StrandedCapacity", state }}
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[3],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        paddingVertical: SPACE[3],
        paddingHorizontal: SPACE[4],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: SPACE[2],
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "kpiLabel"),
            { color: t.textSoft },
          ]}
        >
          Cluster headroom
        </Text>
        <View
          style={{
            paddingVertical: 2,
            paddingHorizontal: 7,
            borderRadius: RADIUS[2],
            backgroundColor: `${sColor}18`,
            borderWidth: 1,
            borderColor: `${sColor}55`,
          }}
        >
          <Text
            style={[
              resolveTypeStyle(t, "label"),
              {
                color: sColor,
                fontWeight: "700",
                letterSpacing: 0.2,
                textTransform: "uppercase",
              },
            ]}
          >
            {state}
          </Text>
        </View>
      </View>

      {rows.map((r) => (
        <RatioRow key={r.label} row={r} />
      ))}

      <Text
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: t.textSoft, marginTop: SPACE[3] },
        ]}
      >
        {footer}
      </Text>
    </View>
  );
}
