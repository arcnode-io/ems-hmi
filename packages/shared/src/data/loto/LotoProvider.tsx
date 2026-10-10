/**
 * LotoProvider — the site's lockout/tagout state for every screen: GET /loto
 * on mount, again on every `system/loto_changed` beacon and after this
 * session's own set/clear. LOTO is a state, not an alarm — nothing here is
 * acknowledged. The gateway is the authority on writes; this only informs UI.
 *
 * Real-backend builds talk to device-api; mock builds get an in-browser
 * stand-in (mockLotoFetch) over the fixture topology. `fetchFn` overrides
 * both, for tests.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "../auth/AuthProvider";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { usesRealBackend } from "../deployment/deploymentMode";
import { useTopologyView } from "../topology/useTopologyView";
import { useSubscription } from "../mqtt/useSubscription";
import { systemTopic } from "../topics/topicBuilder";
import {
  BROWSER_LOTO_FETCH,
  clearLock,
  fetchLoto,
  fetchLotoHistory,
  setLock,
  type Lock,
  type LockRequest,
  type LotoFetch,
} from "./lotoApi";
import { createMockLotoFetch } from "./mockLotoFetch";

const BEACON_TOPIC = systemTopic("loto_changed");
// Reason: mock builds have no AuthProvider and no token; the mock API ignores it.
const MOCK_TOKEN = "mock";

export interface LotoState {
  status: "loading" | "ready" | "error";
  /** Active locks, oldest first. */
  locks: Lock[];
  /** Every locked device incl. subtrees (device-api expands them). */
  lockedDevices: ReadonlySet<string>;
  /** operator (or a mock build); viewers read only. */
  canWrite: boolean;
  /** Bumps on every successful re-read — lets history views follow along. */
  revision: number;
  /** @throws LotoError with an operator-facing message */
  lock: (deviceId: string, req: LockRequest) => Promise<void>;
  /** @throws LotoError with an operator-facing message */
  clear: (lockId: number) => Promise<void>;
  /** Every lock row for a device, newest first. */
  history: (deviceId: string) => Promise<Lock[]>;
}

export const LotoContext = createContext<LotoState | null>(null);

interface LotoProviderProps {
  /** Test override; defaults to device-api (real builds) or mockLotoFetch. */
  fetchFn?: LotoFetch;
  children: React.ReactNode;
}

export function LotoProvider({ fetchFn, children }: LotoProviderProps): React.ReactElement {
  const { mode, deviceApiUri } = useDeploymentIdentity();
  const auth = useContext(AuthContext);
  const { view } = useTopologyView();
  // Reason: the mock store must outlive topology refetches, so it reads devices through a ref.
  const devicesRef = useRef(view?.devices ?? {});
  devicesRef.current = view?.devices ?? {};
  const real = usesRealBackend(mode);
  const api = useMemo<LotoFetch>(
    () => fetchFn ?? (real ? BROWSER_LOTO_FETCH : createMockLotoFetch(() => devicesRef.current)),
    [fetchFn, real],
  );
  const token = auth?.token ?? (real ? null : MOCK_TOKEN);
  const canWrite = auth === null ? !real : auth.role === "operator";

  const [snapshot, setSnapshot] = useState<{ status: LotoState["status"]; locks: Lock[]; locked: string[]; revision: number }>(
    { status: "loading", locks: [], locked: [], revision: 0 },
  );

  const refresh = useCallback((): Promise<void> =>
    fetchLoto(deviceApiUri, api).then(
      (snap) =>
        setSnapshot((prev) => ({ status: "ready", locks: snap.locks, locked: snap.locked_devices, revision: prev.revision + 1 })),
      // Reason: keep the last good state on a failed re-read; only a first-read failure shows "error".
      () => setSnapshot((prev) => (prev.status === "ready" ? prev : { ...prev, status: "error" })),
    ), [deviceApiUri, api]);

  const beacon = useSubscription<unknown>(BEACON_TOPIC);
  useEffect(() => {
    void refresh();
  }, [refresh, beacon]);

  const writer = useCallback(() => {
    if (token === null) throw new Error("LOTO write without a session token");
    return { baseUri: deviceApiUri, token };
  }, [deviceApiUri, token]);

  const value = useMemo<LotoState>(
    () => ({
      status: snapshot.status,
      locks: snapshot.locks,
      lockedDevices: new Set(snapshot.locked),
      canWrite,
      revision: snapshot.revision,
      lock: async (deviceId, req) => {
        await setLock(writer(), deviceId, req, api);
        await refresh();
      },
      clear: async (lockId) => {
        await clearLock(writer(), lockId, api);
        await refresh();
      },
      history: (deviceId) => fetchLotoHistory(deviceApiUri, deviceId, api),
    }),
    [snapshot, canWrite, writer, api, refresh, deviceApiUri],
  );

  return <LotoContext.Provider value={value}>{children}</LotoContext.Provider>;
}
