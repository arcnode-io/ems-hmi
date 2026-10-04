import { parseDeploymentMode, usesRealBackend } from "./deploymentMode";

describe("parseDeploymentMode", () => {
  it("maps each cfg.yml profile name to its mode", () => {
    // Arrange
    const names = ["local", "beta", "ai-demo", "device-demo", "deployed"];

    // Act
    const modes = names.map((n) => parseDeploymentMode(n));

    // Assert
    expect(modes).toEqual(["local", "beta", "ai-demo", "device-demo", "deployed"]);
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

describe("usesRealBackend", () => {
  it("is true only for the profiles that talk to a real broker + device-api", () => {
    // Arrange
    const modes = ["local", "beta", "ai-demo", "device-demo", "deployed"] as const;

    // Act
    const live = modes.map((m) => usesRealBackend(m));

    // Assert
    expect(live).toEqual([false, true, false, true, true]);
  });
});
