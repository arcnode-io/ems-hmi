/**
 * authClient — the device-api auth boundary. ALL knowledge of how the HMI
 * turns (username, password) into a session token lives in this one module.
 * v2 swaps it for a Keycloak direct-grant client; AuthProvider stays unaware.
 *
 * v1 contract (handoff-backend-device-api-auth.md):
 *   POST {deviceApiUri}/auth/login  { username, password }  ->  { token }
 * The token is a device-api-signed HS256 JWT with claims { sub, role, iat, exp }.
 * The client NEVER verifies the signature — that's the server's job + the broker
 * ACL is the real enforcement. It decodes the payload only to read its own role
 * (cosmetic UI gating) and exp (skip the login gate while still valid).
 */

export type AuthRole = "operator" | "viewer";

export interface LoginResult {
  token: string;
  role: AuthRole;
}

/** Thrown when login fails. `status` is the HTTP status (0 on network error). */
export class AuthError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

const LOGIN_PATH = "/auth/login";

/** Decode a JWT payload segment to a plain object. Null on any malformation. */
function decodePayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const segment = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const parsed: unknown = JSON.parse(atob(segment));
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Read the `role` claim, narrowed to a known AuthRole. Null for an
 * unrecognized/absent role or a malformed token.
 */
export function roleFromToken(token: string): AuthRole | null {
  const role = decodePayload(token)?.["role"];
  return role === "operator" || role === "viewer" ? role : null;
}

/**
 * True if the token's `exp` (seconds since epoch) is at or before `nowMs`.
 * Fail-closed: a malformed token or a missing exp counts as expired.
 */
export function tokenExpired(token: string, nowMs: number): boolean {
  const exp = decodePayload(token)?.["exp"];
  if (typeof exp !== "number") return true;
  return exp * 1000 <= nowMs;
}

/**
 * Exchange credentials for a session token via device-api.
 * @throws AuthError on network failure, non-2xx, or a token-less response.
 */
export async function login(
  deviceApiUri: string,
  username: string,
  password: string,
  fetchFn: typeof fetch = fetch,
): Promise<LoginResult> {
  let res: Response;
  try {
    res = await fetchFn(`${deviceApiUri}${LOGIN_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new AuthError("Couldn't reach the sign-in service", 0);
  }
  if (!res.ok) {
    // Generic — never leak which field was wrong (be handoff).
    throw new AuthError("Incorrect username or password", res.status);
  }
  const body: unknown = await res.json();
  const token = (body as { token?: unknown }).token;
  if (typeof token !== "string" || token.length === 0) {
    throw new AuthError("Sign-in service returned no token", res.status);
  }
  const role = roleFromToken(token);
  if (role === null) {
    throw new AuthError("Token carries no recognized role", res.status);
  }
  return { token, role };
}
