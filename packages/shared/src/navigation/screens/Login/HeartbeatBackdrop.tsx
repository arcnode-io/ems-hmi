/**
 * HeartbeatBackdrop — the login illustration dispatcher. A pulse travels the
 * horizon every 4.6s over an anonymous industrial landscape. Sovereign →
 * phosphor on black + starfield; Solarpunk → pencil sketch on warm cream.
 * Ports design-handoff login-illustrated.jsx.
 */

import React from "react";
import type { Theme } from "../../../theme/tokens";
import { BackdropSovereign } from "./BackdropSovereign";
import { BackdropSolarpunk } from "./BackdropSolarpunk";

export function HeartbeatBackdrop({ theme }: { theme: Theme }): React.ReactElement {
  return theme.name === "sovereign" ? (
    <BackdropSovereign theme={theme} />
  ) : (
    <BackdropSolarpunk theme={theme} />
  );
}
