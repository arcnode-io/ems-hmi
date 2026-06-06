/**
 * AuthProvider lifecycle — token restore on launch, login success/failure
 * transitions, and persistence via the kv store.
 */

import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import { AuthProvider, AuthContext, type AuthState } from "./AuthProvider";
import { AuthError, type LoginResult } from "./authClient";
import { DeploymentIdentityProvider } from "../deployment/DeploymentIdentityProvider";
import type { DeploymentIdentityBase } from "../deployment/DeploymentIdentityProvider";
import { kv } from "../storage/persisted";

const TOKEN_KEY = "@arcnode/auth-token";

const BASE: DeploymentIdentityBase = {
  name: "Test Site",
  host: "localhost",
  siteId: "demo-site",
  mode: "beta",
  chatApiUri: "http://localhost:3000/analyst",
  deviceApiUri: "http://localhost:3000/device",
};

/** Unsigned JWT for fixtures. */
function makeJwt(claims: Record<string, unknown>): string {
  const b64 = (obj: unknown): string =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64({ alg: "HS256" })}.${b64(claims)}.sig`;
}

function harness(
  onValue: (v: AuthState) => void,
  loginFn?: AuthProviderProps["loginFn"],
  now = (): number => 1_000_000,
): React.ReactElement {
  return (
    <DeploymentIdentityProvider base={BASE}>
      <AuthProvider loginFn={loginFn} now={now}>
        <AuthContext.Consumer>
          {(v): null => {
            if (v) onValue(v);
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    </DeploymentIdentityProvider>
  );
}

type AuthProviderProps = React.ComponentProps<typeof AuthProvider>;

beforeEach(async () => {
  await kv.remove(TOKEN_KEY);
});

it("resolves to anonymous when no token is stored", async () => {
  let latest: AuthState | null = null;
  render(harness((v) => (latest = v)));
  await waitFor(() => expect(latest?.status).toBe("anonymous"));
  expect(latest?.token).toBeNull();
  expect(latest?.role).toBeNull();
});

it("restores a stored, unexpired token as authenticated", async () => {
  await kv.set(TOKEN_KEY, makeJwt({ role: "operator", exp: 2000 })); // 2_000_000ms > now
  let latest: AuthState | null = null;
  render(harness((v) => (latest = v)));
  await waitFor(() => expect(latest?.status).toBe("authenticated"));
  expect(latest?.role).toBe("operator");
});

it("discards an expired stored token", async () => {
  await kv.set(TOKEN_KEY, makeJwt({ role: "operator", exp: 500 })); // 500_000ms < now
  let latest: AuthState | null = null;
  render(harness((v) => (latest = v)));
  await waitFor(() => expect(latest?.status).toBe("anonymous"));
  expect(await kv.get(TOKEN_KEY)).toBeNull();
});

it("login success → authenticated, role set, token persisted", async () => {
  const token = makeJwt({ role: "viewer", exp: 2000 });
  const loginFn = async (): Promise<LoginResult> => ({ token, role: "viewer" });
  let latest: AuthState | null = null;
  render(harness((v) => (latest = v), loginFn));
  await waitFor(() => expect(latest?.status).toBe("anonymous"));

  await act(async () => {
    await latest!.login("viewer", "pw");
  });

  expect(latest?.status).toBe("authenticated");
  expect(latest?.role).toBe("viewer");
  expect(await kv.get(TOKEN_KEY)).toBe(token);
});

it("login failure → back to anonymous and rejects", async () => {
  const loginFn = async (): Promise<LoginResult> => {
    throw new AuthError("Incorrect username or password", 401);
  };
  let latest: AuthState | null = null;
  render(harness((v) => (latest = v), loginFn));
  await waitFor(() => expect(latest?.status).toBe("anonymous"));

  await act(async () => {
    await expect(latest!.login("x", "y")).rejects.toThrow(AuthError);
  });

  expect(latest?.status).toBe("anonymous");
  expect(await kv.get(TOKEN_KEY)).toBeNull();
});
