import { curtailmentProgramFrom } from "./useGridState";

describe("curtailmentProgramFrom", () => {
  it("reads der_event_program's enum values off the wire", () => {
    // Arrange / Act
    const programs = ["NONE", "DLR_LINE_CONSTRAINT", "ERCOT_FLEX"].map(curtailmentProgramFrom);

    // Assert
    expect(programs).toEqual(["NONE", "DLR_LINE_CONSTRAINT", "ERCOT_FLEX"]);
  });

  it("reads anything else as unknown (null)", () => {
    // Arrange / Act
    const programs = ["ercot_flex", "DEMAND_RESPONSE", 2, true].map(curtailmentProgramFrom);

    // Assert
    expect(programs).toEqual([null, null, null, null]);
  });
});
