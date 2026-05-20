/**
 * DeploymentIdentityProvider override behavior — setHost should rewrite
 * the hostname portion of absolute URLs and persist via the kv store.
 */

import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import {
  DeploymentIdentityProvider,
  DeploymentIdentityContext,
  type DeploymentIdentity,
  type DeploymentIdentityBase,
} from "./DeploymentIdentityProvider";
import { kv } from "../storage/persisted";

const HOST_KEY = "@arcnode/host-override";

const BASE: DeploymentIdentityBase = {
  name: "Test Site",
  host: "localhost",
  siteId: "demo-site",
  mode: "local",
  chatApiUri: "http://localhost:3000/analyst",
  deviceApiUri: "http://localhost:3000/device",
};

function Probe({ onValue }: { onValue: (v: DeploymentIdentity) => void }): null {
  return (
    <DeploymentIdentityContext.Consumer>
      {(value): null => {
        if (value) onValue(value);
        return null;
      }}
    </DeploymentIdentityContext.Consumer>
  );
}

beforeEach(async () => {
  await kv.remove(HOST_KEY);
});

describe("DeploymentIdentityProvider override", () => {
  it("rewrites hostname in chatApiUri + deviceApiUri when setHost is called", async () => {
    let captured: DeploymentIdentity | null = null;

    render(
      <DeploymentIdentityProvider base={BASE}>
        <Probe onValue={(v) => (captured = v)} />
      </DeploymentIdentityProvider>,
    );
    await waitFor(() => expect(captured).not.toBeNull());
    expect(captured!.chatApiUri).toBe("http://localhost:3000/analyst");

    await act(async () => {
      captured!.setHost("192.168.1.100");
    });

    expect(captured!.host).toBe("192.168.1.100");
    expect(captured!.chatApiUri).toBe("http://192.168.1.100:3000/analyst");
    expect(captured!.deviceApiUri).toBe("http://192.168.1.100:3000/device");
  });

  it("persists the override to the kv store", async () => {
    let captured: DeploymentIdentity | null = null;
    render(
      <DeploymentIdentityProvider base={BASE}>
        <Probe onValue={(v) => (captured = v)} />
      </DeploymentIdentityProvider>,
    );
    await waitFor(() => expect(captured).not.toBeNull());

    await act(async () => {
      captured!.setHost("10.0.0.42");
    });

    await waitFor(async () => {
      expect(await kv.get(HOST_KEY)).toBe("10.0.0.42");
    });
  });

  it("loads a persisted override on mount", async () => {
    await kv.set(HOST_KEY, "10.0.0.50");
    let captured: DeploymentIdentity | null = null;
    render(
      <DeploymentIdentityProvider base={BASE}>
        <Probe onValue={(v) => (captured = v)} />
      </DeploymentIdentityProvider>,
    );
    await waitFor(() => expect(captured?.host).toBe("10.0.0.50"));
    expect(captured!.chatApiUri).toBe("http://10.0.0.50:3000/analyst");
  });

  it("clearing the override (null) restores the cfg host", async () => {
    let captured: DeploymentIdentity | null = null;
    render(
      <DeploymentIdentityProvider base={BASE}>
        <Probe onValue={(v) => (captured = v)} />
      </DeploymentIdentityProvider>,
    );
    await waitFor(() => expect(captured).not.toBeNull());

    await act(async () => {
      captured!.setHost("192.168.1.100");
    });
    expect(captured!.host).toBe("192.168.1.100");

    await act(async () => {
      captured!.setHost(null);
    });
    expect(captured!.host).toBe("localhost");
    expect(captured!.chatApiUri).toBe("http://localhost:3000/analyst");
  });
});
