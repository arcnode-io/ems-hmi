import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { SiteRoot } from "./SiteRoot";
import type { SiteFetch } from "./data/deployment/siteConfig";

// Reason: the animated SVG backdrop doesn't render under jsdom; it's decor.
jest.mock("./navigation/screens/Login/HeartbeatBackdrop", () => ({ HeartbeatBackdrop: (): null => null }));

const OVERLAY_YAML = `
deploymentName: "Acme Site 1"
siteId: "acme_site_1"
mqttUri: ""
deviceApiUri: "/api"
derControlUri: "/der-control"
chatApiUri: "/api"
`;

function site(status: number): { fetchFn: SiteFetch; urls: string[] } {
  const urls: string[] = [];
  const fetchFn: SiteFetch = (url) => {
    urls.push(url);
    return Promise.resolve({ ok: status < 400, status, text: () => Promise.resolve(OVERLAY_YAML) });
  };
  return { fetchFn, urls };
}

const settle = async (): Promise<void> => {
  await act(async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });
};

async function connect(address: string): Promise<void> {
  fireEvent.change(screen.getByTestId("site-address"), { target: { value: address } });
  fireEvent.click(screen.getByRole("button", { name: "Connect" }));
  await settle();
}

beforeEach(() => localStorage.clear());

describe("SiteRoot", () => {
  it("asks for the site address, then signs in to that site", async () => {
    // Arrange
    const { fetchFn, urls } = site(200);
    render(<SiteRoot fetchFn={fetchFn} />);
    await settle();

    // Act
    await connect("ems.acme.example");

    // Assert
    expect([urls, screen.getByTestId("login-site").textContent]).toEqual([
      ["https://ems.acme.example/cfg.customer.yml"],
      "ems.acme.example",
    ]);
    expect(screen.getByText("Sign in to Acme Site 1")).toBeTruthy();
  });

  it("shows why a site can't be reached and stays on the address step", async () => {
    // Arrange
    const { fetchFn } = site(404);
    render(<SiteRoot fetchFn={fetchFn} />);
    await settle();

    // Act
    await connect("ems.acme.example");

    // Assert
    expect(screen.getByText("ems.acme.example has no EMS site config (HTTP 404)")).toBeTruthy();
  });

  it("remembers the site across launches and lets the operator change it", async () => {
    // Arrange
    const { fetchFn } = site(200);
    const first = render(<SiteRoot fetchFn={fetchFn} />);
    await settle();
    await connect("ems.acme.example");
    first.unmount();
    render(<SiteRoot fetchFn={fetchFn} />);
    await settle();
    expect(screen.getByText("Sign in to Acme Site 1")).toBeTruthy();

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Change site" }));
    await settle();

    // Assert
    expect(screen.getByTestId("site-address")).toBeTruthy();
  });
});
