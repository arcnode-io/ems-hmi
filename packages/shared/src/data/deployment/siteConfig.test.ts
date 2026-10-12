import { fetchSiteConfig, type SiteFetch } from "./siteConfig";

const OVERLAY_YAML = `
deploymentName: "Acme Site 1"
deploymentHost: "localhost"
siteId: "acme_site_1"
mqttUri: ""
deviceApiUri: "/api"
derControlUri: "/der-control"
chatApiUri: "/api"
`;

function serving(status: number, body: string): { fetchFn: SiteFetch; urls: string[] } {
  const urls: string[] = [];
  const fetchFn: SiteFetch = (url) => {
    urls.push(url);
    return Promise.resolve({ ok: status < 400, status, text: () => Promise.resolve(body) });
  };
  return { fetchFn, urls };
}

describe("fetchSiteConfig", () => {
  it("reads the site's own cfg file over https and points every API at that site", async () => {
    // Arrange
    const { fetchFn, urls } = serving(200, OVERLAY_YAML);

    // Act
    const cfg = await fetchSiteConfig("ems.acme.example", fetchFn);

    // Assert
    expect([urls, cfg]).toEqual([
      ["https://ems.acme.example/cfg.customer.yml"],
      {
        logLevel: "INFO",
        e2e: false,
        deploymentName: "Acme Site 1",
        deploymentHost: "ems.acme.example",
        siteId: "acme_site_1",
        mqttUri: "",
        deviceApiUri: "https://ems.acme.example/api",
        derControlUri: "https://ems.acme.example/der-control",
        chatApiUri: "https://ems.acme.example/api",
        mode: "deployed",
      },
    ]);
  });

  it("accepts an address typed as a URL", async () => {
    // Arrange
    const { fetchFn, urls } = serving(200, OVERLAY_YAML);

    // Act
    await fetchSiteConfig("  https://ems.acme.example/ ", fetchFn);

    // Assert
    expect(urls).toEqual(["https://ems.acme.example/cfg.customer.yml"]);
  });

  it("names the address when the site serves no config", async () => {
    // Arrange
    const { fetchFn } = serving(404, "");

    // Act / Assert
    await expect(fetchSiteConfig("ems.acme.example", fetchFn)).rejects.toThrow(
      "ems.acme.example has no EMS site config (HTTP 404)",
    );
  });

  it("fails closed on a config missing the site ID", async () => {
    // Arrange
    const { fetchFn } = serving(200, OVERLAY_YAML.replace(/siteId.*\n/, ""));

    // Act / Assert
    await expect(fetchSiteConfig("ems.acme.example", fetchFn)).rejects.toThrow(/siteId/);
  });
});
