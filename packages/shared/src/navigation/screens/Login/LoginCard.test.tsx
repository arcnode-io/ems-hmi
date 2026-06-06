/**
 * LoginCard — validation, the login call, and surfacing an auth rejection.
 * Renders inside the real Theme + DeploymentIdentity + Auth provider tree with
 * an injected loginFn (no network).
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { DeploymentIdentityProvider } from "../../../data/deployment/DeploymentIdentityProvider";
import type { DeploymentIdentityBase } from "../../../data/deployment/DeploymentIdentityProvider";
import { AuthProvider } from "../../../data/auth/AuthProvider";
import { AuthError, type LoginResult } from "../../../data/auth/authClient";
import { kv } from "../../../data/storage/persisted";
import { LoginCard } from "./LoginCard";

const BASE: DeploymentIdentityBase = {
  name: "Brookside DC-1",
  host: "localhost",
  siteId: "demo-site",
  mode: "beta",
  chatApiUri: "http://localhost:3000/analyst",
  deviceApiUri: "http://localhost:3000/device",
};

function mount(loginFn: AuthProviderProps["loginFn"]): void {
  render(
    <ThemeProvider>
      <DeploymentIdentityProvider base={BASE}>
        <AuthProvider loginFn={loginFn}>
          <LoginCard label="Brookside DC-1" />
        </AuthProvider>
      </DeploymentIdentityProvider>
    </ThemeProvider>,
  );
}

type AuthProviderProps = React.ComponentProps<typeof AuthProvider>;

beforeEach(async () => {
  await kv.remove("@arcnode/auth-token");
});

it("shows validation errors when fields are empty", async () => {
  const loginFn = jest.fn();
  mount(loginFn as unknown as AuthProviderProps["loginFn"]);

  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByText("Username required")).toBeTruthy();
  expect(screen.getByText("Password required")).toBeTruthy();
  expect(loginFn).not.toHaveBeenCalled();
});

it("calls login with the entered credentials", async () => {
  const loginFn = jest.fn(
    async (): Promise<LoginResult> => ({ token: "t", role: "operator" }),
  );
  mount(loginFn as unknown as AuthProviderProps["loginFn"]);

  fireEvent.change(screen.getByPlaceholderText("operator"), {
    target: { value: "operator" },
  });
  fireEvent.change(screen.getByPlaceholderText("Your password"), {
    target: { value: "hunter2hunter2" },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  });

  await waitFor(() =>
    expect(loginFn).toHaveBeenCalledWith(
      "http://localhost:3000/device",
      "operator",
      "hunter2hunter2",
    ),
  );
});

it("surfaces a rejection message from the auth service", async () => {
  const loginFn = jest.fn(async (): Promise<LoginResult> => {
    throw new AuthError("Incorrect username or password", 401);
  });
  mount(loginFn as unknown as AuthProviderProps["loginFn"]);

  fireEvent.change(screen.getByPlaceholderText("operator"), {
    target: { value: "operator" },
  });
  fireEvent.change(screen.getByPlaceholderText("Your password"), {
    target: { value: "wrongpass12" },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  });

  expect(
    await screen.findByText("Incorrect username or password"),
  ).toBeTruthy();
});
