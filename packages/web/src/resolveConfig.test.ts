import { resolveConfig, type BakedProfiles } from "./resolveConfig";

const LOCAL = {
  logLevel: "DEBUG" as const,
  e2e: false,
  deploymentName: "Localhost Dev",
  deploymentHost: "localhost",
  siteId: "local_site",
  mqttUri: "ws://localhost:8083/mqtt",
  deviceApiUri: "/api",
  chatApiUri: "http://localhost:8000",
};
const BAKED: BakedProfiles = {
  local: LOCAL,
  "ai-demo": { ...LOCAL, siteId: "demo-site" },
};

// What platform-api's UserData writes today — deployment-specific keys only.
const PLATFORM_OVERLAY = {
  siteId: "acme_site_1",
  deploymentName: "acme_site_1",
  deviceApiUri: "/api",
  chatApiUri: "",
  mqttUri: "",
};

describe("resolveConfig — deployed (the container image)", () => {
  it("builds the config from the mounted overlay, deriving the host from the browser", () => {
    // Arrange / Act
    const cfg = resolveConfig(
      "deployed",
      BAKED,
      PLATFORM_OVERLAY,
      "ems.acme.example",
    );

    // Assert
    expect(cfg).toEqual({
      ...PLATFORM_OVERLAY,
      logLevel: "INFO",
      e2e: false,
      deploymentHost: "ems.acme.example",
      mode: "deployed",
    });
  });

  it("fails closed with no overlay — never falls back to a baked site or its demo login", () => {
    // Arrange / Act / Assert
    expect(() => resolveConfig("deployed", BAKED, null, "h")).toThrow(
      /cfg\.customer\.yml/,
    );
  });

  it("fails closed on an overlay missing a deployment-specific key", () => {
    // Arrange
    const noSite = {
      deploymentName: "acme_site_1",
      deviceApiUri: "/api",
      chatApiUri: "",
      mqttUri: "",
    };

    // Act / Assert
    expect(() => resolveConfig("deployed", BAKED, noSite, "h")).toThrow(
      /siteId/,
    );
  });

  it("takes loginPrefill only from the overlay (the device-demo launcher's file)", () => {
    // Arrange
    const overlay = {
      ...PLATFORM_OVERLAY,
      loginPrefill: { username: "operator", password: "pw" },
    };

    // Act
    const cfg = resolveConfig("deployed", BAKED, overlay, "h");

    // Assert
    expect(cfg.loginPrefill).toEqual({ username: "operator", password: "pw" });
  });
});

describe("resolveConfig — baked builds", () => {
  it("uses the baked profile, with an optional dev overlay on top", () => {
    // Arrange / Act
    const plain = resolveConfig("local", BAKED, null, "h");
    const overlaid = resolveConfig("ai-demo", BAKED, { siteId: "x" }, "h");

    // Assert
    expect([plain, overlaid.siteId, overlaid.mode]).toEqual([
      { ...LOCAL, mode: "local" },
      "x",
      "ai-demo",
    ]);
  });

  it("refuses the mobile-only profiles on web", () => {
    // Arrange / Act / Assert
    expect(() => resolveConfig("beta", BAKED, null, "h")).toThrow(/mobile/);
  });
});
