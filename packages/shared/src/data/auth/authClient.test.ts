/**
 * authClient — device-api auth boundary. Covers JWT role/exp decoding (pure)
 * and the login network exchange (injected fetch).
 */

import { roleFromToken, tokenExpired, login, AuthError } from "./authClient";

/** Build an unsigned JWT (header.payload.sig); the sig is ignored client-side. */
function makeJwt(claims: Record<string, unknown>): string {
  const b64 = (obj: unknown): string =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(claims)}.sig`;
}

describe("roleFromToken", () => {
  it("returns the role claim for an operator token", () => {
    const actual = roleFromToken(makeJwt({ sub: "operator", role: "operator" }));
    expect(actual).toBe("operator");
  });

  it("returns viewer for a viewer token", () => {
    expect(roleFromToken(makeJwt({ role: "viewer" }))).toBe("viewer");
  });

  it("returns null for an unrecognized role", () => {
    expect(roleFromToken(makeJwt({ role: "admin" }))).toBeNull();
  });

  it("returns null for a malformed token", () => {
    expect(roleFromToken("not.a.jwt")).toBeNull();
    expect(roleFromToken("garbage")).toBeNull();
  });
});

describe("tokenExpired", () => {
  it("is false when exp is in the future", () => {
    // exp 2000s = 2_000_000ms; now 1_000_000ms → not expired.
    expect(tokenExpired(makeJwt({ exp: 2000 }), 1_000_000)).toBe(false);
  });

  it("is true once exp has passed", () => {
    expect(tokenExpired(makeJwt({ exp: 2000 }), 3_000_000)).toBe(true);
  });

  it("fails closed on a missing or malformed exp", () => {
    expect(tokenExpired(makeJwt({ role: "operator" }), 0)).toBe(true);
    expect(tokenExpired("garbage", 0)).toBe(true);
  });
});

describe("login", () => {
  it("POSTs credentials and returns token + role", async () => {
    const token = makeJwt({ role: "operator", exp: 9_999_999_999 });
    const fetchFn = (async (url: string, init: RequestInit) => {
      expect(url).toBe("https://api.test/auth/login");
      expect(JSON.parse(init.body as string)).toEqual({
        username: "operator",
        password: "pw",
      });
      return { ok: true, status: 200, json: async () => ({ token }) };
    }) as unknown as typeof fetch;

    const actual = await login("https://api.test", "operator", "pw", fetchFn);
    expect(actual).toEqual({ token, role: "operator" });
  });

  it("throws AuthError on 401 with a generic message", async () => {
    const fetchFn = (async () => ({
      ok: false,
      status: 401,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    await expect(login("https://api.test", "x", "y", fetchFn)).rejects.toThrow(
      AuthError,
    );
  });

  it("throws AuthError when the response carries no token", async () => {
    const fetchFn = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    await expect(login("https://api.test", "x", "y", fetchFn)).rejects.toThrow(
      AuthError,
    );
  });
});
