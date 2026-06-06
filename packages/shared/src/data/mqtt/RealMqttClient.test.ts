/**
 * RealMqttClient — fan-out, subscribe dedupe, unsubscribe-on-last, and publish
 * serialization, exercised against a fake RawMqtt (no broker).
 */

import { RealMqttClient, type RawMqtt } from "./RealMqttClient";

function fakeRaw(): RawMqtt & {
  emit: (topic: string, body: unknown) => void;
  emitRaw: (topic: string, text: string) => void;
  subs: string[];
  unsubs: string[];
  published: Array<{ topic: string; message: string }>;
} {
  let onMessage: ((topic: string, payload: Uint8Array) => void) | null = null;
  const subs: string[] = [];
  const unsubs: string[] = [];
  const published: Array<{ topic: string; message: string }> = [];
  const send = (topic: string, text: string): void =>
    onMessage?.(topic, new TextEncoder().encode(text));
  return {
    subscribe: (topic) => subs.push(topic),
    unsubscribe: (topic) => unsubs.push(topic),
    publish: (topic, message) => published.push({ topic, message }),
    on: (_evt, cb) => {
      onMessage = cb;
    },
    end: () => {},
    emit: (topic, body) => send(topic, JSON.stringify(body)),
    emitRaw: (topic, text) => send(topic, text),
    subs,
    unsubs,
    published,
  };
}

it("fans an incoming frame out to the topic's listeners", () => {
  const raw = fakeRaw();
  const client = new RealMqttClient(raw);
  const seen: unknown[] = [];
  client.subscribe("t/a", (m) => seen.push(m.value));
  raw.emit("t/a", { ts: "2026-01-01T00:00:00Z", value: 42 });
  expect(seen).toEqual([42]);
});

it("subscribes the broker once per topic, unsubscribes on the last listener", () => {
  const raw = fakeRaw();
  const client = new RealMqttClient(raw);
  const off1 = client.subscribe("t/a", () => {});
  const off2 = client.subscribe("t/a", () => {});
  expect(raw.subs).toEqual(["t/a"]); // deduped
  off1();
  expect(raw.unsubs).toEqual([]); // still one listener
  off2();
  expect(raw.unsubs).toEqual(["t/a"]); // last listener gone
});

it("ignores unparseable frames without throwing or fanning out", () => {
  const raw = fakeRaw();
  const client = new RealMqttClient(raw);
  const seen: unknown[] = [];
  client.subscribe("t/a", (m) => seen.push(m.value));
  expect(() => raw.emitRaw("t/a", "{not valid json")).not.toThrow();
  expect(seen).toEqual([]); // malformed frame dropped
});

it("serializes the {ts,value} envelope on publish", () => {
  const raw = fakeRaw();
  const client = new RealMqttClient(raw);
  client.publish("t/cmd", { ts: "2026-01-01T00:00:00Z", value: 7 });
  expect(raw.published[0]?.topic).toBe("t/cmd");
  expect(JSON.parse(raw.published[0]!.message)).toEqual({
    ts: "2026-01-01T00:00:00Z",
    value: 7,
  });
});
