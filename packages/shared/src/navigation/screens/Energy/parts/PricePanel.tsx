/**
 * PricePanel — Energy's day-ahead price trace for the site's settlement
 * point, or why there isn't one. Loading shows the panel frame only — no
 * verdict until the analyst answers.
 */

import React from "react";
import { View, Text } from "react-native";
import { match } from "ts-pattern";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { TimeseriesChart } from "../../../../components/composed/TimeseriesChart/TimeseriesChart";
import type { PriceState } from "../../../../data/forecast/useForecast";
import { EDPanel } from "./EDPanel";

/** Analyst unit slugs → display units; anything else shows as sent. */
const UNIT_LABELS: Readonly<Record<string, string>> = { usd_per_mwh: "$/MWh" } as const;

function Notice({ heading, body }: { heading: string; body: string }): React.ReactElement {
  const t = useTheme();
  return (
    <EDPanel>
      <Text style={[resolveTypeStyle(t, "cardHeading"), { color: t.text }]}>{heading}</Text>
      <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textMid, marginTop: SPACE[2] }]}>{body}</Text>
    </EDPanel>
  );
}

export function PricePanel({ state }: { state: PriceState }): React.ReactElement {
  return (
    <View dataSet={{ comp: "PricePanel", state: state.kind }}>
      {match(state)
        .with({ kind: "loading" }, () => <EDPanel>{null}</EDPanel>)
        .with({ kind: "not-enrolled" }, () => (
          <Notice
            heading="No market connected"
            body="This site isn't enrolled in a market. Prices show here once it is."
          />
        ))
        .with({ kind: "unavailable" }, () => (
          <Notice heading="Prices unavailable" body="The price forecast couldn't be read from the analyst server." />
        ))
        .with({ kind: "prices" }, (prices) => (
          <View style={{ marginHorizontal: SPACE[4] }}>
            <TimeseriesChart
              title={`Day-ahead price · ${prices.settlementPoint}`}
              xAxis={{ label: "Time", kind: "time" }}
              yAxis={{ label: "Price", unit: UNIT_LABELS[prices.unit] ?? prices.unit }}
              series={[{ label: "Forecast", points: prices.points, style: "dashed" }]}
            />
          </View>
        ))
        .exhaustive()}
    </View>
  );
}
