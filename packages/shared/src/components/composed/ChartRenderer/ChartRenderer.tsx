/**
 * ChartRenderer — switches on AnalystArtifact.kind and renders the right
 * canonical visual: line → TimeseriesChart, bar → Histogram (treated as
 * categorical bar), table → ad-hoc Table cell grid (canonical Table
 * pending), pie → ad-hoc PieChart (canonical PieChart pending), error
 * → ErrorCard.
 *
 * v1 scope per [[project-analyst-architecture]]: line + table + error
 * render fully; bar + pie render as minimal placeholders pending canonical
 * Bar/Pie components (tracked in step 27 follow-up).
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import { TimeseriesChart } from "../TimeseriesChart/TimeseriesChart";
import type { AnalystArtifact, ToolError } from "../../../data/analyst/types";

export interface ChartRendererProps {
  artifact: AnalystArtifact;
}

function ErrorCard({ error }: { error: ToolError }): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        padding: SPACE[3],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.statusAlarm,
        borderLeftWidth: 3,
        borderLeftColor: t.statusAlarm,
        borderRadius: RADIUS[3],
        gap: 4,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View
          style={{
            paddingVertical: 2,
            paddingHorizontal: 6,
            borderRadius: 2,
            backgroundColor: `${t.statusAlarm}18`,
            borderWidth: 1,
            borderColor: `${t.statusAlarm}55`,
          }}
        >
          <Text
            style={[
              resolveTypeStyle(t, "caption"),
              {
                fontSize: 9,
                fontWeight: "700",
                letterSpacing: 0.18,
                color: t.statusAlarm,
                textTransform: "uppercase",
              },
            ]}
          >
            {error.code.replace("_", " ")}
          </Text>
        </View>
      </View>
      <Text
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: t.text },
        ]}
      >
        {error.message}
      </Text>
    </View>
  );
}

interface TableRendererProps {
  spec: Extract<AnalystArtifact, { kind: "table" }>["spec"];
}

function severityRailColor(t: Theme, severity?: string): string {
  return match(severity)
    .with("alarm", () => t.statusAlarm)
    .with("warn", () => t.statusWarn)
    .with("ok", () => t.statusOk)
    .otherwise(() => "transparent");
}

function TableRenderer({ spec }: TableRendererProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        overflow: "hidden",
      }}
    >
      <View
        style={{
          paddingVertical: SPACE[2],
          paddingHorizontal: SPACE[3],
          borderBottomWidth: 1,
          borderBottomColor: t.borderSoft,
        }}
      >
        <Text
          style={[
            resolveTypeStyle(t, "cardHeading"),
            { color: t.text, fontSize: 13 },
          ]}
        >
          {spec.title}
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          paddingVertical: SPACE[2],
          paddingHorizontal: SPACE[3],
          borderBottomWidth: 1,
          borderBottomColor: t.borderSoft,
          gap: SPACE[2],
        }}
      >
        {spec.columns.map((col) => (
          <Text
            key={col.key}
            style={[
              resolveTypeStyle(t, "caption"),
              {
                fontSize: 9,
                fontWeight: "700",
                letterSpacing: 0.18,
                color: t.textSoft,
                textTransform: "uppercase",
                flex: 1,
                textAlign: col.align ?? "left",
              },
            ]}
          >
            {col.label}
            {col.unit ? ` (${col.unit})` : ""}
          </Text>
        ))}
      </View>
      {spec.rows.map((row, ri) => {
        const sev = spec.rowSeverity?.[ri];
        return (
          <View
            key={ri}
            style={{
              flexDirection: "row",
              paddingVertical: SPACE[2],
              paddingHorizontal: SPACE[3],
              borderTopWidth: ri > 0 ? 1 : 0,
              borderTopColor: t.borderSoft,
              borderLeftWidth: 3,
              borderLeftColor: severityRailColor(t, sev),
              gap: SPACE[2],
            }}
          >
            {spec.columns.map((col) => {
              const raw = row[col.key];
              const value = raw === null || raw === undefined ? "—" : String(raw);
              return (
                <Text
                  key={col.key}
                  numberOfLines={1}
                  style={[
                    resolveTypeStyle(t, "bodyDense"),
                    {
                      flex: 1,
                      textAlign: col.align ?? "left",
                      color: t.text,
                    },
                  ]}
                >
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

function PlaceholderCard({
  kind,
  title,
}: {
  kind: string;
  title: string;
}): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        padding: SPACE[3],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        gap: 4,
      }}
    >
      <Text style={[resolveTypeStyle(t, "cardHeading"), { color: t.text, fontSize: 13 }]}>
        {title}
      </Text>
      <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft }]}>
        {kind} renderer pending — artifact received but no canonical
        component yet.
      </Text>
    </View>
  );
}

/**
 * Render any AnalystArtifact.
 * @param props artifact (discriminated union)
 * @returns the matching renderer
 */
export function ChartRenderer({
  artifact,
}: ChartRendererProps): React.ReactElement {
  return match(artifact)
    .with({ kind: "line" }, ({ spec }) => (
      <View style={{ marginHorizontal: SPACE[4] }}>
        <TimeseriesChart
          title={spec.title}
          xAxis={spec.xAxis}
          yAxis={spec.yAxis}
          series={spec.series}
          thresholds={spec.thresholds}
          dataAsOf={spec.dataAsOf}
        />
      </View>
    ))
    .with({ kind: "table" }, ({ spec }) => <TableRenderer spec={spec} />)
    .with({ kind: "bar" }, ({ spec }) => (
      <PlaceholderCard kind="Bar" title={spec.title} />
    ))
    .with({ kind: "pie" }, ({ spec }) => (
      <PlaceholderCard kind="Pie" title={spec.title} />
    ))
    .with({ kind: "error" }, (err) => <ErrorCard error={err} />)
    .exhaustive();
}
