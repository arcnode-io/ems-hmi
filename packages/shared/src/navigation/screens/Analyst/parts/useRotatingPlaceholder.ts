/**
 * useRotatingPlaceholder — cycles the composer placeholder through the
 * curated demo-working suggestions, so the empty input keeps offering ideas.
 */

import { useEffect, useState } from "react";
import { DEFAULT_SUGGESTIONS } from "./SuggestionChips";

const ROTATE_MS = 4500;

export function useRotatingPlaceholder(): string {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % DEFAULT_SUGGESTIONS.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, []);
  return DEFAULT_SUGGESTIONS[idx] ?? "";
}
