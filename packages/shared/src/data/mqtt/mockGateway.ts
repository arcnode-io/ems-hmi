/**
 * MockGateway — the demo's stand-in for the industrial gateway's command
 * handling, on the same MQTT contract (dispatch contract: received → done on
 * events/dispatch_state). A `set` command then holds that measurement at the
 * commanded value, republished like a polled reading — the way real hardware
 * reports the setpoint it's running. Demo devices behave like hardware; no
 * market, no revenue, no autopilot.
 */

/** Simulated command latency, gateway receive → device accept. */
export const GATEWAY_ACK_MS = 1500;
/** Republish period of a held setpoint (1 Hz, like polled telemetry). */
const HOLD_REPUBLISH_MS = 1000;

export type Broadcast = (topic: string, msg: object) => void;

interface Held {
  value: number;
  nextAt: number;
}

interface Due {
  at: number;
  run: () => void;
}

/** `sites/{s}/devices/{d}/commands/set/{m}/{u}` → its state + measurement topics. */
function topicsFor(commandTopic: string): { state: string; measurement: string } {
  const [, site, , device, , , measurement, unit] = commandTopic.split("/");
  const base = `sites/${site}/devices/${device}`;
  return { state: `${base}/events/dispatch_state`, measurement: `${base}/measurements/${measurement}/${unit}` };
}

export class MockGateway {
  private readonly held = new Map<string, Held>();
  private due: Due[] = [];

  constructor(private readonly broadcast: Broadcast) {}

  /** Handle a published command frame ({ ts, value, command_id }). */
  command(topic: string, frame: Record<string, string | number>, now: number): void {
    const { state, measurement } = topicsFor(topic);
    const commandId = String(frame.command_id);
    const event = (phase: string): object => ({ ts: new Date().toISOString(), command_id: commandId, phase });
    this.broadcast(state, event("received"));
    this.due.push({
      at: now + GATEWAY_ACK_MS,
      run: () => {
        this.held.set(measurement, { value: Number(frame.value), nextAt: now + GATEWAY_ACK_MS });
        this.broadcast(state, event("done"));
      },
    });
  }

  /** Advance to `now`: fire due acks, republish held setpoints. */
  tick(now: number): void {
    const ready = this.due.filter((d) => d.at <= now);
    this.due = this.due.filter((d) => d.at > now);
    ready.forEach((d) => d.run());
    for (const [topic, h] of this.held) {
      if (now < h.nextAt) continue;
      h.nextAt = now + HOLD_REPUBLISH_MS;
      this.broadcast(topic, { ts: new Date().toISOString(), value: h.value });
    }
  }

  /** True when this measurement topic is driven by a commanded setpoint. */
  holds(topic: string): boolean {
    return this.held.has(topic);
  }
}
