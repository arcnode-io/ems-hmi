/**
 * Gateway stub — plays the industrial gateway's MQTT side of the dispatch
 * contract, as arcnode_gateway on the real broker: a `set` command is acked
 * `received`, then `done` on events/dispatch_state, and the device then
 * reports the commanded value on its measurement topic. Test-only.
 */

import { connectAsync, type MqttClient } from "mqtt";
import { GATEWAY } from "./stack";

const COMMANDS = "sites/+/devices/+/commands/set/#";
/** Gateway receive → device accept. */
const ACK_MS = 500;

interface CommandFrame {
  ts: string;
  value: number;
  command_id: string;
}

/** `sites/{s}/devices/{d}/commands/set/{m}/{u}` → its state + measurement topics. */
function topicsFor(commandTopic: string): { state: string; measurement: string } {
  const [, site, , device, , , measurement, unit] = commandTopic.split("/");
  const base = `sites/${site}/devices/${device}`;
  return { state: `${base}/events/dispatch_state`, measurement: `${base}/measurements/${measurement}/${unit}` };
}

function frame(body: object): string {
  return JSON.stringify({ ts: new Date().toISOString(), ...body });
}

/**
 * Connect and answer every set command.
 * @param brokerUrl mqtt://host:port of the stack's broker
 * @returns the connected client; `endAsync()` it on teardown
 */
export async function startGatewayStub(brokerUrl: string): Promise<MqttClient> {
  const client = await connectAsync(brokerUrl, { ...GATEWAY, clientId: "e2e-gateway-stub" });
  client.on("message", (topic, payload) => {
    const command = JSON.parse(payload.toString()) as CommandFrame;
    const { state, measurement } = topicsFor(topic);
    void client.publishAsync(state, frame({ command_id: command.command_id, phase: "received" }));
    setTimeout(() => {
      void client.publishAsync(measurement, frame({ value: command.value }));
      void client.publishAsync(state, frame({ command_id: command.command_id, phase: "done" }));
    }, ACK_MS);
  });
  await client.subscribeAsync(COMMANDS);
  return client;
}
