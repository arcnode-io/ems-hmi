/**
 * Render any AnalystArtifact wrapped in `ArtifactCard`. Titles containing
 * "PLACEHOLDER" get a DEMO DATA chip via `detectPlaceholder`.
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../theme/tokens";
import { SPACE } from "../../../theme/tokens/primitives";
import { TimeseriesChart } from "../TimeseriesChart/TimeseriesChart";
import type { AnalystArtifact, ToolError } from "../../../data/analyst/types";
import { ArtifactCard } from "./ArtifactCard";
import { detectPlaceholder } from "./helpers";
import { BarChart } from "./BarChart";
import { PieChart } from "./PieChart";

export interface ChartRendererProps {
  artifact: AnalystArtifact;
}

function ErrorBody({ error }: { error: ToolError }): React.ReactElement {
  const t = useTheme();
  return (
    <View style={{ paddingVertical: SPACE[3], paddingHorizontal: SPACE[3] }}>
      <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text }]}>
        {error.message}
      </Text>
    </View>
  );
}

function severityRailColor(t: Theme, severity?: string): string {
  return match(severity)
    .with("alarm", () => t.statusAlarm)
    .with("warn", () => t.statusWarn)
    .with("ok", () => t.statusOk)
    .otherwise(() => "transparent");
}

function TableBody({ spec }: { spec: Extract<AnalystArtifact, { kind: "table" }>["spec"] }): React.ReactElement {
  const t = useTheme();
  return (
    <View>
      <View style={{ flexDirection: "row", paddingVertical: SPACE[2], paddingHorizontal: SPACE[3], borderBottomWidth: 1, borderBottomColor: t.borderSoft, gap: SPACE[2] }}>
        {spec.columns.map((col) => (
          <Text key={col.key} style={[resolveTypeStyle(t, "caption"), { fontSize: 9, fontWeight: "700", letterSpacing: 0.18, color: t.textSoft, textTransform: "uppercase", flex: 1, textAlign: col.align ?? "left" }]}>
            {col.label}{col.unit ? ` (${col.unit})` : ""}
          </Text>
        ))}
      </View>
      {spec.rows.map((row, ri) => {
        const sev = spec.rowSeverity?.[ri];
        return (
          <View key={ri} style={{ flexDirection: "row", paddingVertical: SPACE[2], paddingHorizontal: SPACE[3], borderTopWidth: ri > 0 ? 1 : 0, borderTopColor: t.borderSoft, borderLeftWidth: 3, borderLeftColor: severityRailColor(t, sev), gap: SPACE[2] }}>
            {spec.columns.map((col) => {
              const raw = row[col.key];
              const value = raw === null || raw === undefined ? "—" : String(raw);
              return (
                <Text key={col.key} numberOfLines={1} style={[resolveTypeStyle(t, "bodyDense"), { flex: 1, textAlign: col.align ?? "left", color: t.text }]}>
                  {value}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

export function ChartRenderer({ artifact }: ChartRendererProps): React.ReactElement {
  const t = useTheme();
  const placeholderBadge = (title: string): { badge?: string; badgeColor?: string } =>
    detectPlaceholder(title)
      ? { badge: "demo data", badgeColor: t.statusWarn }
      : {};

  return match(artifact)
    .with({ kind: "line" }, ({ spec }) => (
      <ArtifactCard title={spec.title} dataAsOf={spec.dataAsOf} {...placeholderBadge(spec.title)}>
        <View style={{ paddingVertical: SPACE[2] }}>
          <TimeseriesChart
            title=""
            xAxis={spec.xAxis}
            yAxis={spec.yAxis}
            series={spec.series}
            thresholds={spec.thresholds}
          />
        </View>
      </ArtifactCard>
    ))
    .with({ kind: "bar" }, ({ spec }) => (
      <ArtifactCard title={spec.title} dataAsOf={spec.dataAsOf} {...placeholderBadge(spec.title)}>
        <BarChart spec={spec} />
      </ArtifactCard>
    ))
    .with({ kind: "pie" }, ({ spec }) => (
      <ArtifactCard title={spec.title} dataAsOf={spec.dataAsOf} {...placeholderBadge(spec.title)}>
        <PieChart spec={spec} />
      </ArtifactCard>
    ))
    .with({ kind: "table" }, ({ spec }) => (
      <ArtifactCard title={spec.title} dataAsOf={spec.dataAsOf} {...placeholderBadge(spec.title)}>
        <TableBody spec={spec} />
      </ArtifactCard>
    ))
    .with({ kind: "error" }, (err) => (
      <ArtifactCard title={err.code.replace("_", " ").toUpperCase()} dataAsOf={err.dataAsOf} badge={err.code} badgeColor={t.statusAlarm}>
        <ErrorBody error={err} />
      </ArtifactCard>
    ))
    .exhaustive();
}
