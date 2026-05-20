/**
 * Smoke test for MockMqttProvider end-to-end:
 * TopologyProvider feeds bounds → MockMqttProvider builds tickers → rAF loop
 * → subscriber receives a message.
 *
 * Uses fake timers + manual rAF stepping because jsdom's rAF is naive.
 */

import React, { useEffect, useState } from "react";
import { act, render } from "@testing-library/react";
import { MockMqttProvider } from "./MockMqttProvider";
import { TopologyProvider } from "../topology/TopologyProvider";
import { useSubscription } from "./useSubscription";
import { measurementTopic } from "../topics/topicBuilder";
import type { TopologyViewType } from "../topology/topology.schema";
import type { MqttMessage } from "./MqttClient";

const fixtureView: TopologyViewType = {
  deployment_uuid: "00000000-0000-0000-0000-000000000000",
  ems_mode: "sim",
  sizing_ref: null,
  sizing_params: {
    P_compute_total_kW: 100,
    E_BESS_total_kWh: 200,
    T_coolant_setpoint_C: 18,
  },
  devices: {
    bess_01: {
      device_id: "bess_01",
      template: "bess_leaf",
      parent: null,
      display_name: "BESS Unit 1",
      blocking: ["live_mode"],
      extra_measurements: null,
    },
  },
  buses: [],
  templates_used: {
    bess_leaf: {
      template: "bess_leaf",
      kind: "leaf",
      equipment_id: "EQ-001",
      vendor: "Acme",
      model: "X1",
      description: "BESS leaf",
      measurements: {
        soc: {
          unit: "percent",
          type: "float",
          poll_rate_hz: 10,
          display_name_default: "State of Charge",
          iec_61850_ref: "ZBAT.BatChaSt",
          bounds: { min: 0, max: 100, nominal: 50 },
          thresholds: {
            warn_min: 10,
            warn_max: 90,
            alarm_min: 5,
            alarm_max: 95,
          },
          values: null,
        },
      },
      commands: {},
    },
  },
};

/**
 * Probe component — subscribes to the SoC topic and captures the latest message.
 */
function Probe({
  onMessage,
}: {
  onMessage: (msg: MqttMessage<number> | null) => void;
}): null {
  const latest = useSubscription<number>(
    measurementTopic("demo-site", "bess_01", "soc", "percent"),
  );
  useEffect(() => {
    onMessage(latest);
  }, [latest, onMessage]);
  return null;
}

describe("MockMqttProvider end-to-end", () => {
  beforeEach(() => {
    // Stub fetch so TopologyProvider receives the fixture synchronously.
    (global as unknown as { fetch: jest.Mock }).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async (): Promise<TopologyViewType> => fixtureView,
    });
  });

  it("delivers a sim measurement through TopologyProvider → MockMqttProvider → useSubscription", async () => {
    // Arrange
    const received: Array<MqttMessage<number> | null> = [];
    const onMessage = (msg: MqttMessage<number> | null): void => {
      received.push(msg);
    };

    // Act
    await act(async () => {
      render(
        <TopologyProvider viewUrl="/api/topology/view">
          <MockMqttProvider siteId="demo-site">
            <Probe onMessage={onMessage} />
          </MockMqttProvider>
        </TopologyProvider>,
      );
    });
    // Wait for the rAF loop to deliver at least one tick.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Assert: at least one non-null message arrived.
    const nonNull = received.filter((m) => m !== null);
    expect(nonNull.length).toBeGreaterThan(0);
    const msg = nonNull[nonNull.length - 1]!;
    expect(typeof msg.value).toBe("number");
    expect(msg.value).toBeGreaterThanOrEqual(10); // warn_min
    expect(msg.value).toBeLessThanOrEqual(90); // warn_max
    expect(typeof msg.ts).toBe("string");
  });
});
