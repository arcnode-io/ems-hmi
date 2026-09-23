import { routeByName } from "./routes";

describe("routes", () => {
  it("serves SLD and Grid at top-level paths, not nested under /modules", () => {
    // Arrange
    const sld = routeByName("Sld");
    const grid = routeByName("Grid");

    // Act
    const paths = [sld.path, grid.path];

    // Assert
    expect(paths).toEqual(["sld", "grid"]);
  });

  it("gives SLD and Grid their own sidebar entries matching their URLs", () => {
    // Arrange
    const sld = routeByName("Sld");
    const grid = routeByName("Grid");

    // Act
    const sidebars = [sld.sidebar, grid.sidebar];

    // Assert
    expect(sidebars).toEqual(["/sld", "/grid"]);
  });
});
