import { MockGateway, GATEWAY_ACK_MS } from "./mockGateway";

const CMD = "sites/s/devices/bess_module_1/commands/set/active_power/watts";
const STATE = "sites/s/devices/bess_module_1/events/dispatch_state";
const MEAS = "sites/s/devices/bess_module_1/measurements/active_power/watts";

describe("MockGateway", () => {
  it("acks a setpoint command like the real gateway, then holds the device at it", () => {
    // Arrange
    const wire: Array<[string, unknown]> = [];
    const gateway = new MockGateway((topic, msg) => wire.push([topic, msg]));

    // Act
    gateway.command(CMD, { ts: "t", value: 500_000, command_id: "c1" }, 0);
    gateway.tick(GATEWAY_ACK_MS);

    // Assert
    expect(wire.map(([topic, msg]) => [topic, (msg as { phase?: string; value?: number }).phase ?? (msg as { value: number }).value])).toEqual([
      [STATE, "received"],
      [STATE, "done"],
      [MEAS, 500_000],
    ]);
    expect(gateway.holds(MEAS)).toBe(true);
  });
});
