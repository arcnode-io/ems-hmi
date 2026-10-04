/**
 * Guards the baked cfg.yml profiles. Every MQTT topic is keyed by siteId, so
 * a profile whose siteId drifts from what the backend publishes renders an
 * empty UI with no error anywhere. Real-backend sites are NOT baked: the
 * `deployed` image takes its site from the runtime /cfg.customer.yml.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

interface Profile {
  loginPrefill?: { username: string; password: string };
  siteId: string;
}

const CFG: Record<string, Profile> = parse(
  readFileSync(join(__dirname, "..", "cfg.yml"), "utf8"),
) as Record<string, Profile>;

describe("web cfg.yml", () => {
  it("bakes only the mock profiles — real sites come from the deployer's overlay", () => {
    // Arrange + Act
    const names = Object.keys(CFG);

    // Assert
    expect(names).toEqual(["local", "ai-demo"]);
  });

  it("gives local an ADR-002 §16 snake_case site id of its own", () => {
    // Arrange
    const SITE_ID = /^[a-z][a-z0-9_]{0,62}[a-z0-9]$/;

    // Act
    const siteId = CFG.local?.siteId ?? "";

    // Assert
    expect([siteId, SITE_ID.test(siteId)]).toEqual(["local_site", true]);
  });

  it("bakes no login prefill anywhere — a demo login can only come from the device-demo launcher", () => {
    // Arrange + Act
    const prefilled = Object.values(CFG).filter(
      (profile) => profile.loginPrefill !== undefined,
    );

    // Assert
    expect(prefilled).toEqual([]);
  });
});
