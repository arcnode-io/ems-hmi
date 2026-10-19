/**
 * Bring up the real stack once per run: build the `deployed` HMI, start the
 * containers, start the gateway stub, and log the operator in through
 * device-api so every test starts authenticated (storageState).
 */

import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { startStack, HMI_PORT, OPERATOR } from "./fixtures/stack";
import { startGatewayStub } from "./fixtures/gatewayStub";

const WEB_ROOT = join(import.meta.dirname, "..");
const ORIGIN = `http://localhost:${HMI_PORT}`;
/** AuthProvider's localStorage key for the session token. */
const TOKEN_KEY = "@arcnode/auth-token";
export const STORAGE_STATE = join(WEB_ROOT, ".auth", "operator.json");

export default async function globalSetup(): Promise<() => Promise<void>> {
  execSync("npm run build", { cwd: WEB_ROOT, stdio: "inherit", env: { ...process.env, VITE_ENV: "deployed" } });
  const stack = await startStack(join(import.meta.dirname, "fixtures", "dtm.json"));
  const gateway = await startGatewayStub(stack.brokerUrl);

  const res = await fetch(`${ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(OPERATOR),
  });
  if (!res.ok) throw new Error(`operator login failed: HTTP ${res.status}`);
  const { token } = (await res.json()) as { token: string };
  mkdirSync(dirname(STORAGE_STATE), { recursive: true });
  writeFileSync(
    STORAGE_STATE,
    JSON.stringify({ cookies: [], origins: [{ origin: ORIGIN, localStorage: [{ name: TOKEN_KEY, value: token }] }] }),
  );

  return async () => {
    await gateway.endAsync();
    await stack.stop();
  };
}
