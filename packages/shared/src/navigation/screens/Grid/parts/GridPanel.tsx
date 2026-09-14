/**
 * GridPanel — card wrapper + key/value row, local to the Grid screen.
 * Mirrors EDPanel/GDRow's role for Energy — screen-local, not a canonical
 * contract (see design-handoff/03-screens/grid-detail-desktop.jsx GDPanel/GDRow).
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";

interface GridPanelProps {
  title?: string;
  meta?: string;
  children: React.ReactNode;
}

export function GridPanel({ title, meta, children }: GridPanelProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        marginHorizontal: SPACE[4],
        marginTop: SPACE[3],
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: RADIUS[3],
        padding: SPACE[4],
        gap: SPACE[2],
      }}
    >
      {title ? (
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: SPACE[2] }}>
          <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>{title}</Text>
          {meta ? (
            <Text style={[resolveTypeStyle(t, "caption"), { color: t.textFaint }]}>{meta}</Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

type RowTone = "ok" | "warn" | "alarm" | "soft" | "default";

function toneColor(t: Theme, tone: RowTone | undefined): string {
  if (tone === "ok") return t.statusOk;
  if (tone === "warn") return t.statusWarn;
  if (tone === "alarm") return t.statusAlarm;
  if (tone === "soft") return t.textSoft;
  return t.text;
}

interface GridRowProps {
  k: string;
  v: string;
  u?: string;
  tone?: RowTone;
  hint?: string;
}

/** Key/value row — label left, optional hint, value + unit right. */
export function GridRow({ k, v, u, tone, hint }: GridRowProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        gap: SPACE[2],
        paddingBottom: SPACE[2],
        borderBottomWidth: 1,
        borderBottomColor: t.borderSoft,
      }}
    >
      <Text style={[resolveTypeStyle(t, "label"), { color: t.textMid, flex: 1 }]}>{k}</Text>
      {hint ? (
        <Text style={[resolveTypeStyle(t, "caption"), { color: t.textFaint }]}>{hint}</Text>
      ) : null}
      <Text
        style={[
          resolveTypeStyle(t, "bodyDense"),
          { color: toneColor(t, tone), fontWeight: "600" },
        ]}
      >
        {v}
        {u ? <Text style={{ fontSize: 10, color: t.textMid, fontWeight: "400" }}> {u}</Text> : null}
      </Text>
    </View>
  );
}
