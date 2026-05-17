/**
 * DrawDistribution — per-server draw histogram. Demonstrates the
 * canonical Histogram component end-to-end on the Compute screen.
 */

import React from "react";
import { View } from "react-native";
import { SPACE } from "../../../../theme/tokens/primitives";
import { Histogram } from "../../../../components/composed/Histogram/Histogram";
import { MOCK_COMPUTE } from "../data/mockCompute";

const PER_SERVER_CAP_W = 728;

export function DrawDistribution(): React.ReactElement {
  const samples = MOCK_COMPUTE.servers.map((s) => s.draw);
  return (
    <View style={{ marginHorizontal: SPACE[4], marginTop: SPACE[2] }}>
      <Histogram
        samples={samples}
        unit="W"
        domainColor="colorCompute"
        // Reason: warn band starts at 90% of per-server cap (advisory),
        // alarm at the cap itself. Outlier bins paint statusAlarm per
        // Histogram contract.
        thresholds={{ max: PER_SERVER_CAP_W * 0.9 }}
      />
    </View>
  );
}
