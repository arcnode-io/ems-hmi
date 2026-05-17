/**
 * usePulseOpacity — drives a 0.7 ↔ 1.0 opacity cycle for alarm indicators per
 * constitution rule 3.2 (breathe, not flash). Returns a plain number so the
 * caller can apply it inline; no Animated dependency, no native-driver
 * surprise — RAF-driven, halts on prefers-reduced-motion (rule 5) and pegs
 * to MAX_OPACITY.
 */

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";
import { MOTION } from "../theme/tokens/primitives";

const MIN_OPACITY = 0.7;
const MAX_OPACITY = 1.0;
const RANGE = MAX_OPACITY - MIN_OPACITY;

/**
 * Returns the current pulse opacity for an indicator. Static `MAX_OPACITY`
 * when reduced-motion is on or `enabled` is false.
 * @param enabled when false the hook returns MAX_OPACITY without RAF cost
 * @returns opacity between MIN_OPACITY and MAX_OPACITY
 */
export function usePulseOpacity(enabled: boolean = true): number {
  const reduced = useReducedMotion();
  const active = enabled && !reduced;
  const [opacity, setOpacity] = useState(MAX_OPACITY);

  useEffect(() => {
    if (!active) {
      setOpacity(MAX_OPACITY);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const period = MOTION.duration.pulse;
    const tick = (now: number): void => {
      // Reason: half-cosine in [0,1] gives the standard ease-in-out breath
      // shape (1 - cos(πx)) / 2 over one period.
      const phase = ((now - start) % period) / period;
      const ease = (1 - Math.cos(2 * Math.PI * phase)) / 2;
      setOpacity(MIN_OPACITY + ease * RANGE);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return (): void => cancelAnimationFrame(raf);
  }, [active]);

  return opacity;
}
