/**
 * DrawDistribution — per-node draw histogram (canonical Histogram). Warn line
 * at 90% of the node PSU cap, read from live `power_limit`.
 */

import React from "react";
import { View } from "react-native";
import { SPACE } from "../../../../theme/tokens/primitives";
import { Histogram } from "../../../../components/composed/Histogram/Histogram";
import type { GpuFleet } from "../../../../data/compute/useGpuFleet";
import { drawSamples } from "./computeView";

export function DrawDistribution({ fleet }: { fleet: GpuFleet }): React.ReactElement {
  const { samples, warnAtW } = drawSamples(fleet);
  return (
    <View style={{ marginHorizontal: SPACE[4], marginTop: SPACE[2] }}>
      <Histogram
        samples={samples}
        unit="W"
        domainColor="colorCompute"
        // Reason: outlier bins past the warn line paint statusAlarm per the
        // Histogram contract; no line until a node reports its cap.
        thresholds={warnAtW === null ? undefined : { max: warnAtW }}
      />
    </View>
  );
}
