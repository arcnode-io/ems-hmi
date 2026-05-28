/**
 * useBreakpoint — returns the current responsive breakpoint based on viewport width.
 *
 * Mirrors design-handoff/01-tokens/tokens.ts BREAKPOINTS:
 *   xs: < 480   (phone)
 *   sm: 480-1023 (tablet)
 *   lg: 1024-1599 (desktop)
 *   xl: ≥ 1600  (NOC TV)
 *
 * Layouts coarsen to phone vs desktop: <1024 = phone-style chrome (TopBar +
 * BottomTabs), ≥1024 = desktop-style chrome (Sidebar + TopBar + StatusStrip).
 * Tablet (sm) renders phone-style for now; revisit when a tablet-specific
 * design lands.
 */

import { useWindowDimensions } from "react-native";
import { BREAKPOINTS } from "../theme/tokens";

export type Breakpoint = "xs" | "sm" | "lg" | "xl";
export type LayoutKind = "phone" | "desktop";

interface BreakpointResult {
  breakpoint: Breakpoint;
  layout: LayoutKind;
  width: number;
  height: number;
}

/**
 * Resolve the active breakpoint from window width.
 * @returns breakpoint + coarse layout kind + raw dimensions
 */
export function useBreakpoint(): BreakpointResult {
  const { width, height } = useWindowDimensions();
  const breakpoint: Breakpoint =
    width >= BREAKPOINTS.xl
      ? "xl"
      : width >= BREAKPOINTS.lg
        ? "lg"
        : width >= BREAKPOINTS.sm
          ? "sm"
          : "xs";
  const layout: LayoutKind = width >= BREAKPOINTS.lg ? "desktop" : "phone";
  return { breakpoint, layout, width, height };
}
