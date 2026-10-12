import { brokerFallbackHost } from "./brokerHost.native";

describe("brokerFallbackHost (native)", () => {
  it("follows the device-api scheme — https site → wss, plain-http stack → ws", () => {
    // Arrange / Act
    const actual = [
      brokerFallbackHost("ems.acme.example", "https://ems.acme.example/api"),
      brokerFallbackHost("10.0.2.2", "http://10.0.2.2/api"),
    ];

    // Assert
    expect(actual).toEqual([
      { host: "ems.acme.example", secure: true },
      { host: "10.0.2.2", secure: false },
    ]);
  });
});
