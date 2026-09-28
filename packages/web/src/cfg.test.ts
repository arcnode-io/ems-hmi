/**
 * Guards the baked cfg.yml profiles. Every MQTT topic is keyed by siteId, so
 * a profile whose siteId drifts from what the backend publishes renders an
 * empty UI with no error anywhere.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

interface Profile {
  siteId: string;
  mqttUri: string;
  deviceApiUri: string;
}

const CFG: Record<string, Profile> = parse(
  readFileSync(join(__dirname, "..", "cfg.yml"), "utf8"),
) as Record<string, Profile>;

describe("web cfg.yml", () => {
  it("has exactly the four deployment profiles", () => {
    // Arrange + Act
    const names = Object.keys(CFG);

    // Assert
    expect(names).toEqual(["local", "beta", "ai-demo", "device-demo"]);
  });

  it("keys device-demo to demo_site, the id the compose stack publishes on", () => {
    // Arrange + Act
    const siteId = CFG["device-demo"]?.siteId;

    // Assert
    expect(siteId).toBe("demo_site");
  });

  it("gives local its own site id so it can't collide with device-demo", () => {
    // Arrange + Act
    const siteId = CFG.local?.siteId;

    // Assert
    expect(siteId).toBe("local_site");
  });

  it("uses ADR-002 §16 snake_case site ids for local and device-demo", () => {
    // Arrange
    const SITE_ID = /^[a-z][a-z0-9_]{0,62}[a-z0-9]$/;

    // Act
    const ids = [CFG.local?.siteId, CFG["device-demo"]?.siteId];

    // Assert
    expect(ids.every((id) => SITE_ID.test(id ?? ""))).toBe(true);
  });

  it("points device-demo at the same-origin compose proxy", () => {
    // Arrange + Act
    const { mqttUri, deviceApiUri } = CFG["device-demo"] ?? { mqttUri: "x", deviceApiUri: "x" };

    // Assert
    expect({ mqttUri, deviceApiUri }).toEqual({ mqttUri: "", deviceApiUri: "/api" });
  });
});
