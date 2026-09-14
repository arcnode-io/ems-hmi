/**
 * BessSocTrend — real SoC samples since this page was opened, via
 * useBessSocHistory. Not a 24h chart (no historical-telemetry source
 * exists anywhere in this app) — labeled "this session" rather than
 * implying a longer window it can't actually show.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { TimeseriesChart } from "../../../../components/composed/TimeseriesChart/TimeseriesChart";
import type { SocSample } from "../../../../data/bess/useBessSocHistory";

interface BessSocTrendProps {
  samples: readonly SocSample[];
}

export function BessSocTrend({ samples }: BessSocTrendProps): React.ReactElement {
  const t = useTheme();

  if (samples.length < 2) {
    return (
      <View
        style={{
          padding: SPACE[4],
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: RADIUS[3],
        }}
      >
        <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.textSoft }]}>
          Collecting SoC samples for this session…
        </Text>
      </View>
    );
  }

  return (
    <TimeseriesChart
      title="State of charge · this session"
      xAxis={{ label: "Time", kind: "time" }}
      yAxis={{ label: "SoC", unit: "%" }}
      series={[
        {
          label: "SoC",
          points: samples.map((s) => ({ x: s.ts, y: s.value })),
          interpolation: "linear",
        },
      ]}
    />
  );
}
