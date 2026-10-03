import { balanceChart } from "./balanceChart";

describe("balanceChart", () => {
  it("maps W to kW per series, keeps gaps, and says how far back the window reaches", () => {
    // Arrange
    const balance = {
      series: {
        grid: [{ x: 1, y: 1_120_000 }, { x: 2, y: 20 }],
        bess: [{ x: 1, y: 0 }, { x: 2, y: 1_120_000 }],
        compute: [{ x: 1, y: 1_029_000 }, { x: 2, y: null }],
      },
      hasHistory: false,
    };
    const colors = { grid: "g", bess: "b", compute: "c" };

    // Act
    const chart = balanceChart(balance, colors);

    // Assert
    expect(chart).toEqual({
      title: "Power balance · since page load",
      series: [
        { label: "Grid import", color: "g", points: [{ x: 1, y: 1120 }, { x: 2, y: 0.02 }] },
        { label: "Battery discharge", color: "b", points: [{ x: 1, y: 0 }, { x: 2, y: 1120 }] },
        { label: "Compute draw", color: "c", points: [{ x: 1, y: 1029 }, { x: 2, y: null }] },
      ],
    });
  });

  it("titles the window as the last 15 min once history seeded it", () => {
    // Arrange / Act
    const { title } = balanceChart({ series: { grid: [], bess: [], compute: [] }, hasHistory: true }, { grid: "", bess: "", compute: "" });

    // Assert
    expect(title).toBe("Power balance · last 15 min");
  });
});
