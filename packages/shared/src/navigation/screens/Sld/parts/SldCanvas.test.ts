import { reversePath } from "./SldCanvas";

describe("reversePath", () => {
  it("swaps endpoints of a two-point M/L path", () => {
    const actual = reversePath("M 360 156 L 360 188");
    const expected = "M 360 188 L 360 156";
    expect(actual).toBe(expected);
  });

  it("handles decimal coords + negative values", () => {
    const actual = reversePath("M -12.5 10 L 100 -7.25");
    const expected = "M 100 -7.25 L -12.5 10";
    expect(actual).toBe(expected);
  });

  it("returns input unchanged when shape isn't a two-point M/L", () => {
    const input = "M 0 0 L 10 10 L 20 0";
    expect(reversePath(input)).toBe(input);
  });
});
