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

it("refuses an empty topic instead of sending a filter the broker disconnects on", () => {
  // Arrange — HiveMQ drops the whole connection on an empty topic filter,
  // blanking every panel in a silent reconnect loop.
  const raw = fakeRaw();
  const client = new RealMqttClient(raw);

  // Act + Assert
  expect(() => client.subscribe("", () => {})).toThrow(/empty topic/);
  expect(raw.subs).toEqual([]);
});

it("replays the last message to a listener that joins an already-subscribed topic", () => {
  // Arrange — the broker only replays retained state to a NEW subscription, and
  // the client dedupes subscribes, so a second hook on a transition-only topic
  // (event_active) would otherwise sit at null until the next transition.
  const raw = fakeRaw();
  const client = new RealMqttClient(raw);
  client.subscribe("t/a", () => {});
  raw.emit("t/a", { ts: "2026-01-01T00:00:00Z", value: true });
  const late: unknown[] = [];

  // Act
  client.subscribe("t/a", (m) => late.push(m.value));

  // Assert
  expect(late).toEqual([true]);
});

it("forgets the cached message once the last listener unsubscribes", () => {
  // Arrange
  const raw = fakeRaw();
  const client = new RealMqttClient(raw);
  const off = client.subscribe("t/a", () => {});
  raw.emit("t/a", { ts: "2026-01-01T00:00:00Z", value: 1 });
  off();
  const seen: unknown[] = [];

  // Act — a fresh broker subscribe; the broker's retain will deliver, not a stale cache
  client.subscribe("t/a", (m) => seen.push(m.value));

  // Assert
  expect(seen).toEqual([]);
});

it("routes a concrete topic to a wildcard filter's listeners, passing the topic along", () => {
  // Arrange
  const raw = fakeRaw();
  const client = new RealMqttClient(raw);
  const seen: [string, unknown][] = [];
  client.subscribe("sites/s/devices/+/measurements/p/watts", (msg, topic) => seen.push([topic, msg.value]));

  // Act
  raw.emit("sites/s/devices/n1/measurements/p/watts", { ts: "2026-01-01T00:00:00Z", value: 8000 });
  raw.emit("sites/s/devices/n1/measurements/q/watts", { ts: "2026-01-01T00:00:00Z", value: 1 });

  // Assert
  expect(seen).toEqual([["sites/s/devices/n1/measurements/p/watts", 8000]]);
});

it("replays every cached topic under a wildcard to a late joiner", () => {
  // Arrange — first listener holds the filter; two topics arrive
  const raw = fakeRaw();
  const client = new RealMqttClient(raw);
  client.subscribe("sites/s/devices/+/measurements/p/watts", () => {});
  raw.emit("sites/s/devices/n1/measurements/p/watts", { ts: "2026-01-01T00:00:00Z", value: 1 });
  raw.emit("sites/s/devices/n2/measurements/p/watts", { ts: "2026-01-01T00:00:00Z", value: 2 });

  // Act
  const replayed: [string, unknown][] = [];
  client.subscribe("sites/s/devices/+/measurements/p/watts", (msg, topic) => replayed.push([topic, msg.value]));

  // Assert
  expect(replayed).toEqual([["sites/s/devices/n1/measurements/p/watts", 1], ["sites/s/devices/n2/measurements/p/watts", 2]]);
});

it("refuses a site-wide wildcard before it ever reaches the broker", () => {
  // Arrange
  const raw = fakeRaw();
  const client = new RealMqttClient(raw);

  // Act / Assert
  expect(() => client.subscribe("sites/s1/devices/+/measurements/#", () => {})).toThrow(/wildcard/);
  expect(raw.subs).toEqual([]);
});
