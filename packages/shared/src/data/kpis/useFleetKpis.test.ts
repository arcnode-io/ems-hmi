import { avgIfComplete, sumIfComplete } from "./useFleetKpis";

describe("fleet aggregates", () => {
  it("are unknown until every device has reported — a partial sum or average is a wrong number", () => {
    // Arrange
    const partial = [40, null, 60];
    const complete = [40, 50, 60];

    // Act
    const actual = [sumIfComplete(partial), avgIfComplete(partial), sumIfComplete(complete), avgIfComplete(complete), sumIfComplete([])];

    // Assert
    expect(actual).toEqual([null, null, 150, 50, null]);
  });
});
