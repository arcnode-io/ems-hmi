import { bessFlow } from "./bessFlow";

describe("bessFlow", () => {
  it("labels + as discharging, - as charging, a small deadband as idle, null as a dash", () => {
    // Arrange — bess_module active_power is + discharge / - charge
    const inputs = [911_000, -250_000, 400, null];

    // Act
    const flows = inputs.map(bessFlow);

    // Assert
    expect(flows).toEqual([
      { label: "Discharging", value: "911 kW" },
      { label: "Charging", value: "250 kW" },
      { label: "Idle", value: "0 kW" },
      { label: "—", value: "—" },
    ]);
  });
});
