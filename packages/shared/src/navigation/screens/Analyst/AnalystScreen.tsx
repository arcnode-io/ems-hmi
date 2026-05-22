/**
 * AnalystScreen — conversational analyst. Phone renders one inline stream
 * (AnalystMobile); desktop renders the two-pane layout — left artifact
 * canvas, right conversation (AnalystDesktop).
 */

import React from "react";
import { useBreakpoint } from "../../../hooks/useBreakpoint";
import { AnalystMobile } from "./parts/AnalystMobile";
import { AnalystDesktop } from "./parts/AnalystDesktop";

export function AnalystScreen(): React.ReactElement {
  return useBreakpoint().layout === "desktop" ? (
    <AnalystDesktop />
  ) : (
    <AnalystMobile />
  );
}
