/**
 * brokerCreds — exchange a valid session token for the role's broker
 * credential. Fetched lazily by RealMqttProvider at connect time and used
 * once; never persisted (it's a live secret, not session state).
 *
 * Contract (handoff-backend-device-api-auth.md):
 *   GET {deviceApiUri}/auth/mqtt-credentials   Authorization: Bearer <token>
 *   -> { username, password, url }
 * `url` ships empty ("") in v1 → the caller derives it by convention. A
 * non-empty url means "convention won't reach me, use this".
 */

export interface BrokerCreds {
  username: string;
  password: string;
  /** Broker URL, or "" → caller derives `wss://<host>/mqtt`. */
  url: string;
}

const CREDS_PATH = "/auth/mqtt-credentials";

/** Thrown when the credential exchange fails. `status` is the HTTP status. */
export class BrokerCredError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "BrokerCredError";
    this.status = status;
  }
}

function isCreds(value: unknown): value is BrokerCreds {
  const v = value as Partial<BrokerCreds> | null;
  return (
    typeof v === "object" &&
    v !== null &&
    typeof v.username === "string" &&
    typeof v.password === "string" &&
    typeof v.url === "string"
  );
}

/**
 * Fetch the broker credential for the authenticated role.
 * @throws BrokerCredError on network failure, non-2xx (401 expired / 403
 *   unknown role), or a malformed body.
 */
export async function fetchBrokerCreds(
  deviceApiUri: string,
  token: string,
  fetchFn: typeof fetch = fetch,
): Promise<BrokerCreds> {
  let res: Response;
  try {
    res = await fetchFn(`${deviceApiUri}${CREDS_PATH}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new BrokerCredError("Couldn't reach the credential service", 0);
  }
  if (!res.ok) {
    throw new BrokerCredError("Broker credential request rejected", res.status);
  }
  const body: unknown = await res.json();
  if (!isCreds(body)) {
    throw new BrokerCredError("Malformed broker credential response", res.status);
  }
  return body;
}
