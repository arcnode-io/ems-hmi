/**
 * useAuth — access the session token + role from any descendant of
 * AuthProvider. Throws if used outside the provider.
 */

import { useContext } from "react";
import { AuthContext, type AuthState } from "./AuthProvider";

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
