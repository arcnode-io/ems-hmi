/**
 * DerEventNoticeProvider — watches der_dispatch.event_active for the
 * false→true edge (not the level — a still-true value on next render
 * shouldn't re-notify) and provides DerEventNotice to descendants.
 *
 * Mount once near the root, wrapping NavigationRoot (same place as
 * DispatchContext's own provider), so both AppLayout (bell badge) and
 * GridScreen (markSeen on visit) can consume it.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDerEventActive } from "./useDerEventActive";
import { DerEventNoticeContext, type DerEventNotice } from "./DerEventNoticeContext";

export function DerEventNoticeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const active = useDerEventActive();
  const wasActiveRef = useRef(false);
  const [unseen, setUnseen] = useState(false);

  useEffect(() => {
    if (active && !wasActiveRef.current) setUnseen(true);
    wasActiveRef.current = active;
  }, [active]);

  const markSeen = useCallback((): void => setUnseen(false), []);
  const value = useMemo<DerEventNotice>(() => ({ unseen, markSeen }), [unseen, markSeen]);

  return (
    <DerEventNoticeContext.Provider value={value}>
      {children}
    </DerEventNoticeContext.Provider>
  );
}
