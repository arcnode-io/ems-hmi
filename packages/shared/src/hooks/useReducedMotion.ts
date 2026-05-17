/**
 * useReducedMotion — observes the platform's `prefers-reduced-motion` setting.
 * Cross-platform via RN's AccessibilityInfo (web maps to the OS media query;
 * native maps to the OS accessibility setting).
 *
 * Constitution rule 5 — decorative motion gates on this. Alarm pulses become
 * static state color + opacity step; SLD particle flow becomes a static
 * arrowhead. Information value must survive without motion.
 */

import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Track the platform's reduce-motion setting.
 * @returns `true` if the user has requested reduced motion; `false` otherwise
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => {
        if (mounted) setReduced(v);
      })
      .catch(() => {
        // Reason: feature-detection failure is benign — keep motion enabled.
      });
    // Reason: RN-Web in jsdom may return undefined here — accessibility
    // events aren't supported under test. Optional-chain the cleanup.
    const sub = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      setReduced,
    );
    return (): void => {
      mounted = false;
      sub?.remove();
    };
  }, []);

  return reduced;
}
