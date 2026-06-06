/**
 * AuthProvider — holds the session token + role for the real-broker modes.
 * Restores a persisted, still-valid token on launch (so a reload doesn't force
 * re-login); clears it on expiry or logout. The device-api specifics live in
 * authClient — this provider is impl-agnostic so the v2 Keycloak swap is a
 * one-file change.
 *
 * Reads the EFFECTIVE deviceApiUri from DeploymentIdentity (post host-override),
 * so a native IP override points auth at the right host too.
 */

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { kv } from "../storage/persisted";
import {
  login as defaultLogin,
  roleFromToken,
  tokenExpired,
  type AuthRole,
  type LoginResult,
} from "./authClient";

const TOKEN_KEY = "@arcnode/auth-token";

export type AuthStatus =
  | "loading" // checking for a persisted token; render a splash, not the gate
  | "anonymous"
  | "authenticating"
  | "authenticated";

export interface AuthState {
  status: AuthStatus;
  token: string | null;
  role: AuthRole | null;
  /** Resolves on success; rejects with AuthError (card shows `.message`). */
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  /** DI for tests; defaults to the device-api login client. */
  loginFn?: typeof defaultLogin;
  /** DI for tests; defaults to Date.now. */
  now?: () => number;
}

export function AuthProvider({
  children,
  loginFn = defaultLogin,
  now = Date.now,
}: AuthProviderProps): React.ReactElement {
  const { deviceApiUri } = useDeploymentIdentity();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);

  // Restore a persisted, still-valid token on launch.
  useEffect(() => {
    let cancelled = false;
    void (async (): Promise<void> => {
      const stored = await kv.get(TOKEN_KEY);
      if (cancelled) return;
      if (stored !== null && !tokenExpired(stored, now())) {
        setToken(stored);
        setRole(roleFromToken(stored));
        setStatus("authenticated");
        return;
      }
      if (stored !== null) await kv.remove(TOKEN_KEY);
      if (!cancelled) setStatus("anonymous");
    })();
    return (): void => {
      cancelled = true;
    };
  }, [now]);

  const login = useCallback(
    async (username: string, password: string): Promise<void> => {
      setStatus("authenticating");
      try {
        const result: LoginResult = await loginFn(
          deviceApiUri,
          username,
          password,
        );
        await kv.set(TOKEN_KEY, result.token);
        setToken(result.token);
        setRole(result.role);
        setStatus("authenticated");
      } catch (err) {
        setStatus("anonymous");
        throw err; // the login card surfaces the message
      }
    },
    [deviceApiUri, loginFn],
  );

  const logout = useCallback((): void => {
    void kv.remove(TOKEN_KEY);
    setToken(null);
    setRole(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo<AuthState>(
    () => ({ status, token, role, login, logout }),
    [status, token, role, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
