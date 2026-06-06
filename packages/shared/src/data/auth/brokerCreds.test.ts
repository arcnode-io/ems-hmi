/**
 * brokerCreds — token→broker-credential exchange. Asserts the Bearer header,
 * happy-path parse, and error mapping.
 */

import { fetchBrokerCreds, BrokerCredError } from "./brokerCreds";

it("GETs with a Bearer token and returns the credential", async () => {
  const creds = { username: "arcnode_operator", password: "s3cret", url: "" };
  const fetchFn = (async (url: string, init: RequestInit) => {
    expect(url).toBe("https://api.test/auth/mqtt-credentials");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok123",
    );
    return { ok: true, status: 200, json: async () => creds };
  }) as unknown as typeof fetch;

  const actual = await fetchBrokerCreds("https://api.test", "tok123", fetchFn);
  expect(actual).toEqual(creds);
});

it("throws BrokerCredError on 401 (expired token)", async () => {
  const fetchFn = (async () => ({
    ok: false,
    status: 401,
    json: async () => ({}),
  })) as unknown as typeof fetch;

  await expect(
    fetchBrokerCreds("https://api.test", "tok", fetchFn),
  ).rejects.toThrow(BrokerCredError);
});

it("throws BrokerCredError on a malformed body", async () => {
  const fetchFn = (async () => ({
    ok: true,
    status: 200,
    json: async () => ({ username: "x" }), // missing password + url
  })) as unknown as typeof fetch;

  await expect(
    fetchBrokerCreds("https://api.test", "tok", fetchFn),
  ).rejects.toThrow(BrokerCredError);
});
