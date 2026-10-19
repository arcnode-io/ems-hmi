import { parseDeploymentMode } from "./deploymentMode";

describe("parseDeploymentMode", () => {
  it("maps each cfg.yml profile name to its mode", () => {
    // Arrange
    const names = ["local", "device-demo", "deployed"];

    // Act
    const modes = names.map((n) => parseDeploymentMode(n));

    // Assert
    expect(modes).toEqual(["local", "device-demo", "deployed"]);
  });

  it("defaults to local when the env var is unset", () => {
    // Arrange + Act
    const mode = parseDeploymentMode(undefined);

    // Assert
    expect(mode).toBe("local");
  });

  it("throws on an unknown profile name instead of silently building local", () => {
    // Arrange + Act + Assert
    expect(() => parseDeploymentMode("demo")).toThrow(/no 'demo' profile/);
  });
});
