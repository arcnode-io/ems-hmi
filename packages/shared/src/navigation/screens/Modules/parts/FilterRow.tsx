/**
 * FilterRow — horizontal chip selector. Filter by class (All / BESS / Compute
 * / Grid / etc). Tap toggles which subset of modules renders.
 */

import React from "react";
import { ScrollView, Pressable, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";

export interface FilterOption {
  id: string;
  label: string;
  count: number;
}

interface FilterRowProps {
  options: readonly FilterOption[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function FilterRow({
  options,
  activeId,
  onSelect,
}: FilterRowProps): React.ReactElement {
  const t = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        marginTop: SPACE[3],
        paddingHorizontal: SPACE[4],
        gap: 6,
        paddingRight: SPACE[2],
      }}
    >
      {options.map((f) => {
        const active = f.id === activeId;
        return (
          <Pressable
            key={f.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={(): void => onSelect(f.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: RADIUS.full,
              borderWidth: 1,
              backgroundColor: active ? t.text : "transparent",
              borderColor: active ? t.text : t.border,
              flexShrink: 0,
            }}
          >
            <Text
              style={[
                resolveTypeStyle(t, "label"),
                {
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 0.15,
                  textTransform: "uppercase",
                  color: active ? t.bg : t.textMid,
                },
              ]}
            >
              {f.label}
            </Text>
            <Text
              style={[
                resolveTypeStyle(t, "label"),
                {
                  fontSize: 11,
                  fontWeight: "400",
                  color: active ? t.bg : t.textSoft,
                  opacity: 0.85,
                },
              ]}
            >
              {f.count}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
