/**
 * ChatBubble — canonical Analyst chat message. User / assistant variants.
 * The bubble holds *prose* only; artifacts (charts/tables/etc.) render
 * below the bubble via ChartRenderer (the chart is the canonical signal,
 * the bubble is just the explanation — per ChatBubble.md anti-rule).
 *
 * See design-handoff/02-components/ChatBubble.md.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import { SPACE, RADIUS } from "../../../theme/tokens/primitives";

export type ChatRole = "user" | "assistant" | "loading";

export interface ChatBubbleProps {
  role: ChatRole;
  /** Bubble body — prose. Empty/undefined when role==="loading". */
  text?: string;
  /** ISO or pre-formatted clock; rendered above the bubble. */
  time: string;
  /** Seconds elapsed in current "loading" state. Drives the soft "still
   *  working" warning above 30s. Ignored for other roles. */
  elapsedSec?: number;
}

function alphaHex(hex: string, alpha: string): string {
  if (hex.startsWith("#") && hex.length === 7) return `${hex}${alpha}`;
  return hex;
}

/** Coarse "HH:MM" formatter from an ISO timestamp. */
function fmtClock(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

const SOFT_WARN_AFTER_SEC = 30;

export function ChatBubble({
  role,
  text,
  time,
  elapsedSec = 0,
}: ChatBubbleProps): React.ReactElement {
  const t = useTheme();
  const isUser = role === "user";
  const isLoading = role === "loading";

  const bubbleBg = isUser ? alphaHex(t.accent, "20") : t.surface;
  const bubbleBorder = isUser ? t.accentBorder : t.borderSoft;
  const textColor = t.text;

  const label = isUser ? "You" : "Analyst";

  return (
    <View
      dataSet={{ comp: "ChatBubble", role }}
      style={{
        paddingHorizontal: SPACE[4],
        gap: 3,
        alignItems: isUser ? "flex-end" : "flex-start",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        {!isUser ? (
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              backgroundColor: t.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontFamily: t.fontLabel,
                fontSize: 9,
                fontWeight: "800",
              }}
            >
              A
            </Text>
          </View>
        ) : null}
        <Text
          style={[
            resolveTypeStyle(t, "caption"),
            {
              fontSize: 8,
              fontWeight: "700",
              letterSpacing: 0.18,
              color: t.textSoft,
              textTransform: "uppercase",
            },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            resolveTypeStyle(t, "caption"),
            { fontSize: 8, color: t.textSoft, opacity: 0.7 },
          ]}
        >
          · {fmtClock(time)}
        </Text>
      </View>

      <View
        style={{
          maxWidth: "88%",
          paddingVertical: 7,
          paddingHorizontal: 11,
          backgroundColor: bubbleBg,
          borderWidth: 1,
          borderColor: bubbleBorder,
          borderRadius: RADIUS[3],
          // Reason: tail-corner per role — user bottom-right, assistant bottom-left.
          borderBottomLeftRadius: isUser ? RADIUS[3] : 4,
          borderBottomRightRadius: isUser ? 4 : RADIUS[3],
        }}
      >
        {isLoading ? (
          <View style={{ gap: 4 }}>
            <Text
              style={[
                resolveTypeStyle(t, "bodyDense"),
                { color: t.textSoft, fontStyle: "italic" },
              ]}
            >
              thinking…
            </Text>
            {elapsedSec >= SOFT_WARN_AFTER_SEC ? (
              <Text
                style={[
                  resolveTypeStyle(t, "caption"),
                  { fontSize: 10, color: t.textSoft },
                ]}
              >
                still working — on prem llm runs can take ~100s;
              </Text>
            ) : null}
          </View>
        ) : (
          <Text
            style={[
              resolveTypeStyle(t, "body"),
              { color: textColor, fontSize: 12, lineHeight: 17 },
            ]}
          >
            {text ?? ""}
          </Text>
        )}
      </View>
    </View>
  );
}
