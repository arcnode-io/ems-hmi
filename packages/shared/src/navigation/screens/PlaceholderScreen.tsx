/**
 * PlaceholderScreen — generic stub for a route that's not yet ported. Shows
 * the route name + any params + theme color so eyeballing the breakpoint
 * + theme rendering is fast.
 *
 * Replace each route's `component={PlaceholderScreen(name)}` with the real
 * screen as it lands.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";

interface PlaceholderProps {
  label: string;
  detail?: string;
}

/**
 * Render a centered "Screen pending" panel.
 * @param props label + optional detail
 * @param props.label Screen label (route name + params)
 * @param props.detail Optional second line
 * @returns View element
 */
export function PlaceholderScreen({
  label,
  detail,
}: PlaceholderProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: t.bg,
        gap: t.space[2],
      }}
    >
      <Text
        style={{
          fontFamily: t.fontHeading,
          fontSize: 32,
          color: t.text,
          textTransform: t.name === "sovereign" ? "uppercase" : "none",
          letterSpacing: t.name === "sovereign" ? 0.5 : 0,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: t.fontLabel,
          fontSize: 10,
          letterSpacing: 0.18,
          color: t.textSoft,
          textTransform: "uppercase",
        }}
      >
        Screen pending port
      </Text>
      {detail ? (
        <Text
          style={{
            fontFamily: t.fontLabel,
            fontSize: 11,
            color: t.textMid,
            marginTop: t.space[2],
          }}
        >
          {detail}
        </Text>
      ) : null}
    </View>
  );
}
