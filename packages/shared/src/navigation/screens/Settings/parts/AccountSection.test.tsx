import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "../../../../theme/ThemeProvider";
import { DeploymentIdentityProvider } from "../../../../data/deployment/DeploymentIdentityProvider";
import { AuthContext, type AuthState } from "../../../../data/auth/AuthProvider";
import { AccountSection } from "./AccountSection";

const VIEWER: AuthState = {
  status: "authenticated", token: "tok", role: "viewer", login: () => Promise.resolve(), logout: () => undefined,
};

function renderSection(auth: AuthState | null): void {
  render(
    <ThemeProvider>
      <DeploymentIdentityProvider
        base={{ name: "Site A", host: "h", siteId: "s", mode: "deployed", chatApiUri: "", deviceApiUri: "", derControlUri: "" }}
      >
        <AuthContext.Provider value={auth}>
          <AccountSection />
        </AuthContext.Provider>
      </DeploymentIdentityProvider>
    </ThemeProvider>,
  );
}

describe("AccountSection", () => {
  it("shows the signed-in role and site, nothing else", () => {
    // Arrange
    renderSection(VIEWER);

    // Act
    const values = screen.getAllByTestId("account-value").map((n) => n.textContent);

    // Assert
    expect(values).toEqual(["Viewer", "Site A"]);
  });

  it("a build without login is the operator session", () => {
    // Arrange
    renderSection(null);

    // Act
    const values = screen.getAllByTestId("account-value").map((n) => n.textContent);

    // Assert
    expect(values).toEqual(["Operator", "Site A"]);
  });
});
