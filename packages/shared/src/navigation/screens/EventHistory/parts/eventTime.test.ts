import { eventTime } from "./eventTime";

describe("eventTime", () => {
  it("prints an absolute date + time to the second — a log needs exact times, not '5m ago'", () => {
    // Arrange / Act
    const actual = eventTime("2026-10-10T18:39:02.418Z", "UTC");

    // Assert
    expect(actual).toBe("Oct 10, 18:39:02");
  });
});
