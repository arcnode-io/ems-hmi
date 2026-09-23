/**
 * useDerEventNotice() — read + clear the unseen-DER-event flag.
 * Must be used within DerEventNoticeProvider (mounted once near the root).
 */

import { useContext } from "react";
import { DerEventNoticeContext, type DerEventNotice } from "./DerEventNoticeContext";

/**
 * @returns unseen flag + markSeen()
 * @throws Error if used outside DerEventNoticeProvider
 */
export function useDerEventNotice(): DerEventNotice {
  const ctx = useContext(DerEventNoticeContext);
  if (ctx === null) {
    throw new Error("useDerEventNotice must be used within DerEventNoticeProvider");
  }
  return ctx;
}
