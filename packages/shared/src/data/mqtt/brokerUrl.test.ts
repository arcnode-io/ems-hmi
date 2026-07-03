import { resolveBrokerUrl } from "./brokerUrl";

describe("resolveBrokerUrl", () => {
  it("derives ws:// for a plain-http page (v1 stacks have nothing on :443)", () => {
    expect(resolveBrokerUrl("", { host: "34.1.2.3", secure: false })).toBe(
      "ws://34.1.2.3/mqtt",
    );
  });

  it("derives wss:// when the page is https", () => {
    expect(resolveBrokerUrl("", { host: "ems.arcnode.io", secure: true })).toBe(
      "wss://ems.arcnode.io/mqtt",
    );
  });

  it("a non-empty server url wins over derivation", () => {
    expect(
      resolveBrokerUrl("wss://broker.example:8083/mqtt", {
        host: "ems.arcnode.io",
        secure: false,
      }),
    ).toBe("wss://broker.example:8083/mqtt");
  });

  it("whitespace-only server url still derives", () => {
    expect(resolveBrokerUrl("  ", { host: "h", secure: false })).toBe("ws://h/mqtt");
  });
});
