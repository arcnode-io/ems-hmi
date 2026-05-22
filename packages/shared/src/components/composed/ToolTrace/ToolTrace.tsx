/**
 * ToolTrace — the agent's tool calls. Two forms:
 *  - LiveToolTrace: the in-flight turn, steps stream in (running → done).
 *  - CompletedToolTrace: a finished turn — collapsed to a one-line summary,
 *    expandable to the full step list.
 */

import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../theme/tokens";
import type { TraceStep } from "../../../data/analyst/conversation.types";
import type { AnalystToolCall } from "../../../data/analyst/types";

type StepStatus = "running" | "done" | "error";

/** Pulsing dot for the running step. */
function RunningDot(): React.ReactElement {
  const t = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.3, duration: 450, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.accent, opacity }}
    />
  );
}

function StepRow({
  status,
  tool,
  label,
}: {
  status: StepStatus;
  tool: string;
  label: string;
}): React.ReactElement {
  const t = useTheme();
  const glyph =
    status === "done" ? "✓" : status === "error" ? "✕" : null;
  const glyphColor = status === "error" ? t.statusAlarm : t.statusOk;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 10, alignItems: "center" }}>
        {glyph ? (
          <Text style={{ fontSize: 9, fontWeight: "800", color: glyphColor }}>
            {glyph}
          </Text>
        ) : (
          <RunningDot />
        )}
      </View>
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          {
            fontSize: 9,
            fontWeight: "700",
            letterSpacing: 0.18,
            color: t.textSoft,
            textTransform: "uppercase",
          },
        ]}
      >
        {tool}
      </Text>
      <Text
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: status === "done" ? t.textSoft : t.text, flex: 1 },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

/** Live trace — steps as they stream in during a turn. */
export function LiveToolTrace({
  steps,
}: {
  steps: readonly TraceStep[];
}): React.ReactElement {
  return (
    <View dataSet={{ comp: "LiveToolTrace" }} style={{ gap: 4 }}>
      {steps.map((s) => (
        <StepRow key={s.seq} status={s.status} tool={s.tool} label={s.label} />
      ))}
    </View>
  );
}

/** Human-readable total tool time. */
function formatTotal(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

/** Completed trace — collapsed summary, expandable to the full step list. */
export function CompletedToolTrace({
  trace,
}: {
  trace: readonly AnalystToolCall[];
}): React.ReactElement | null {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  if (trace.length === 0) return null;
  const totalMs = trace.reduce((sum, c) => sum + c.ms, 0);
  return (
    <View dataSet={{ comp: "CompletedToolTrace" }} style={{ gap: 4 }}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((o) => !o)}
        style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
      >
        <Text style={{ fontSize: 9, color: t.textSoft }}>{open ? "▾" : "▸"}</Text>
        <Text
          style={[
            resolveTypeStyle(t, "caption"),
            { fontSize: 9, letterSpacing: 0.18, color: t.textSoft, textTransform: "uppercase" },
          ]}
        >
          agent · {trace.length} {trace.length === 1 ? "step" : "steps"} ·{" "}
          {formatTotal(totalMs)}
        </Text>
      </Pressable>
      {open
        ? trace.map((c, i) => (
            <StepRow
              key={i}
              status={c.outcome === "error" ? "error" : "done"}
              tool={c.tool}
              label={c.label ?? c.tool}
            />
          ))
        : null}
    </View>
  );
}
