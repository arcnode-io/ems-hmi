/**
 * Intel feed — the headline strip / agent-tool cards are derived from the
 * external-tool calls in recent turns' tool traces. No dedicated endpoint:
 * when the agent calls get_energy_news / get_market_data / a weather tool,
 * that call's `summary` becomes the displayed headline.
 */

import { useAnalystConversation } from "./useAnalystConversation";
import type { ConversationItem } from "./conversation.types";

export type IntelSource = "news" | "market" | "weather";

export interface IntelHeadline {
  source: IntelSource;
  /** Display label for the source, e.g. "gridstatus.io". */
  label: string;
  /** Short category tag, e.g. "Markets". */
  category: string;
  /** The headline text — the tool call's result summary. */
  headline: string;
}

/** Map an external tool name to its feed source, or null for internal tools. */
function classify(
  tool: string,
): Omit<IntelHeadline, "headline"> | null {
  if (tool === "get_energy_news") {
    return { source: "news", label: "Energy News", category: "Energy news" };
  }
  if (tool === "get_market_data") {
    return { source: "market", label: "gridstatus.io", category: "Markets" };
  }
  // Reason: the weather tool's exact name isn't pinned — match loosely.
  if (/weather/i.test(tool)) {
    return { source: "weather", label: "Weather", category: "Weather" };
  }
  return null;
}

/** Latest headline per external source, derived from conversation tool traces. */
export function deriveIntelFeed(items: ConversationItem[]): IntelHeadline[] {
  const bySource = new Map<IntelSource, IntelHeadline>();
  for (const item of items) {
    if (item.kind !== "message" || !item.trace) continue;
    for (const call of item.trace) {
      const cls = classify(call.tool);
      if (!cls || !call.summary) continue;
      bySource.set(cls.source, { ...cls, headline: call.summary });
    }
  }
  return [...bySource.values()];
}

/** Hook form — derives the feed from the live conversation. */
export function useIntelFeed(): IntelHeadline[] {
  return deriveIntelFeed(useAnalystConversation().items);
}
