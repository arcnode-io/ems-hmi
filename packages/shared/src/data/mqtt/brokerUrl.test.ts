import { resolveBrokerUrl } from "./brokerUrl";

describe("resolveBrokerUrl", () => {
  it("derives wss://<host>/mqtt when the server url is empty", () => {
    expect(resolveBrokerUrl("", "ems.arcnode.io")).toBe("wss://ems.arcnode.io/mqtt");
  });

  it("prefers a non-empty server url verbatim", () => {
    expect(resolveBrokerUrl("wss://broker.example:8083/mqtt", "ems.arcnode.io")).toBe(
      "wss://broker.example:8083/mqtt",
    );
  });

  it("treats whitespace-only as empty and derives", () => {
    expect(resolveBrokerUrl("   ", "host:9001")).toBe("wss://host:9001/mqtt");
  });
});
