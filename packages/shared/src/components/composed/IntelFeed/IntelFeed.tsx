/**
 * Intel feed UI — two presentational forms over the same IntelHeadline[]
 * (the screens supply it via useIntelFeed):
 *  - HeadlineStrip: mobile — one cycling strip below the header.
 *  - AgentToolCardRow: desktop — a row of source cards in the header.
 *
 * Both render nothing when the feed is empty — the feed is derived from
 * tool traces, so it stays absent until the agent calls an external tool.
 */

import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";
import type { IntelHeadline } from "../../../data/analyst/intelFeed";

const CYCLE_MS = 4500;

function LiveDot(): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: t.statusOk,
        // soft glow ring
        shadowColor: t.statusOk,
        shadowOpacity: 0.5,
        shadowRadius: 2,
      }}
    />
  );
}

function SourceTag({ headline }: { headline: IntelHeadline }): React.ReactElement {
  const t = useTheme();
  return (
    <Text
      numberOfLines={1}
      style={[
        resolveTypeStyle(t, "caption"),
        {
          fontSize: 8.5,
          fontWeight: "700",
          letterSpacing: 0.18,
          color: t.textSoft,
          textTransform: "uppercase",
        },
      ]}
    >
      {headline.label} · {headline.category}
    </Text>
  );
}

/** Mobile — one strip, cycling through the feed. */
export function HeadlineStrip({
  headlines,
}: {
  headlines: readonly IntelHeadline[];
}): React.ReactElement | null {
  const t = useTheme();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (headlines.length <= 1) return;
    const id = setInterval(
      () => setIdx((i) => (i + 1) % headlines.length),
      CYCLE_MS,
    );
    return () => clearInterval(id);
  }, [headlines.length]);

  const h = headlines[idx % headlines.length];
  if (h === undefined) return null;
  return (
    <View
      dataSet={{ comp: "HeadlineStrip" }}
      style={{
        marginHorizontal: SPACE[4],
        marginBottom: SPACE[2],
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.borderSoft,
        borderRadius: RADIUS[2],
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <LiveDot />
      <SourceTag headline={h} />
      <Text
        numberOfLines={1}
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { flex: 1, color: t.text, fontWeight: "500" },
        ]}
      >
        {h.headline}
      </Text>
    </View>
  );
}

function AgentToolCard({
  headline,
}: {
  headline: IntelHeadline;
}): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        padding: SPACE[2],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[2],
        gap: 3,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <LiveDot />
        <SourceTag headline={headline} />
      </View>
      <Text
        numberOfLines={2}
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: t.text, fontWeight: "500" },
        ]}
      >
        {headline.headline}
      </Text>
    </View>
  );
}

/** Desktop — a row of source cards. */
export function AgentToolCardRow({
  headlines,
}: {
  headlines: readonly IntelHeadline[];
}): React.ReactElement | null {
  if (headlines.length === 0) return null;
  return (
    <View
      dataSet={{ comp: "AgentToolCardRow" }}
      style={{ flexDirection: "row", gap: SPACE[2] }}
    >
      {headlines.map((h) => (
        <AgentToolCard key={h.source} headline={h} />
      ))}
    </View>
  );
}
