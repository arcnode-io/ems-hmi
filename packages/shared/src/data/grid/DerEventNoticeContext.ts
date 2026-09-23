/**
 * DerEventNoticeContext — "has the operator seen the latest DER event yet."
 *
 * Per handoff-auto-mode-dispatch-notification-2026-09-22.md: in
 * DispatchMode.AUTO an event goes straight to ACTIVE with zero operator
 * interaction, and the only existing signal (CurtailmentBanner on the Grid
 * screen) is passive — nothing tells an operator who isn't already there.
 * Reuses the existing alarm-bell badge pattern (TopBar's AlarmBell) rather
 * than a new component: `unseen` folds into the same count, `markSeen`
 * clears it once the operator actually visits the Grid screen.
 *
 * Mirrors DispatchContext's shape — a plain context object, provided once
 * near the root (see DerEventNoticeProvider), consumed via useDerEventNotice.
 */

import { createContext } from "react";

export interface DerEventNotice {
  /** True from the event_active false→true edge until markSeen() is called. */
  unseen: boolean;
  markSeen: () => void;
}

export const DerEventNoticeContext = createContext<DerEventNotice | null>(null);
