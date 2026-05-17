/**
 * DisplaySection — theme switcher (System / Solarpunk / Sovereign) + optional
 * unit-preference rows. "System" matches the OS color-scheme; the other two
 * lock a manual choice. ThemeProvider already supports both modes.
 */

import React from "react";
import { View, Text, Pressable, useColorScheme } from "react-native";
import { Svg, Circle, Path } from "react-native-svg";
import { useTheme } from "../../../../theme/ThemeProvider";
import { useThemeControl } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle, type Theme } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { SetPanel, SetSectionHead } from "./SetPanel";

function IconSystem({ size = 20, color }: { size?: number; color: string }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M12 3 a9 9 0 0 1 0 18 z" fill={color} />
    </Svg>
  );
}

function IconSun({ size = 20, color }: { size?: number; color: string }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.8} fill="none" />
      <Path
        d="M12 2 v2 M12 20 v2 M4.93 4.93 l1.41 1.41 M17.66 17.66 l1.41 1.41 M2 12 h2 M20 12 h2 M4.93 19.07 l1.41-1.41 M17.66 6.34 l1.41-1.41"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function IconMoon({ size = 20, color }: { size?: number; color: string }): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M21 12.8 A9 9 0 1 1 11.2 3 A7 7 0 0 0 21 12.8 z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface ChoiceProps {
  name: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
  Icon: React.ComponentType<{ size?: number; color: string }>;
}

function Choice({ name, sub, selected, onPress, Icon }: ChoiceProps): React.ReactElement {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: SPACE[3],
        paddingHorizontal: SPACE[2],
        backgroundColor: selected ? t.accentFaint : t.bg,
        borderWidth: 1,
        borderColor: selected ? t.accent : t.border,
        borderRadius: RADIUS[2],
        alignItems: "center",
        gap: 6,
      }}
    >
      <Icon size={20} color={selected ? t.accent : t.textMid} />
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          {
            fontSize: 11,
            fontWeight: "700",
            color: selected ? t.accent : t.text,
            letterSpacing: 0.05,
          },
        ]}
      >
        {name}
      </Text>
      <Text
        style={[
          resolveTypeStyle(t, "caption"),
          {
            fontSize: 9,
            letterSpacing: 0.18,
            color: t.textSoft,
            textTransform: "uppercase",
          },
        ]}
      >
        {sub}
      </Text>
    </Pressable>
  );
}

interface UnitsRowProps {
  label: string;
  options: readonly string[];
  selected: string;
  onSelect: (v: string) => void;
}

function UnitsRow({ label, options, selected, onSelect }: UnitsRowProps): React.ReactElement {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[3] }}>
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          {
            flex: 1,
            fontSize: 11,
            color: t.textMid,
            letterSpacing: 0.12,
            fontWeight: "600",
            textTransform: "uppercase",
          },
        ]}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: RADIUS[2],
          overflow: "hidden",
          backgroundColor: t.bg,
        }}
      >
        {options.map((o, i) => {
          const active = o === selected;
          return (
            <Pressable
              key={o}
              onPress={(): void => onSelect(o)}
              style={{
                paddingVertical: 5,
                paddingHorizontal: 12,
                backgroundColor: active ? t.text : "transparent",
                borderRightWidth: i < options.length - 1 ? 1 : 0,
                borderRightColor: t.border,
              }}
            >
              <Text
                style={[
                  resolveTypeStyle(t, "label"),
                  {
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 0.05,
                    color: active ? t.bg : t.textMid,
                  },
                ]}
              >
                {o}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface DisplaySectionProps {
  withUnits?: boolean;
}

export function DisplaySection({ withUnits = false }: DisplaySectionProps): React.ReactElement {
  const t = useTheme();
  const { themeName, setTheme } = useThemeControl();
  const osScheme = useColorScheme();
  // Reason: "System" choice = no user override. Today our ThemeProvider
  // doesn't expose "system" as a distinct state separate from the OS-
  // matched themeName, so a System-selected state is inferred only when
  // themeName === osScheme. Future: extend ThemeProvider with a clear()
  // method that resets the user override.
  // OS scheme is "light" | "dark" | null; map to our theme names then
  // compare to detect "System" alignment.
  const osThemeName = osScheme === "dark" ? "sovereign" : "solarpunk";
  const isSystem = themeName === osThemeName;
  const [powerUnit, setPowerUnit] = React.useState("kW");
  const [tempUnit, setTempUnit] = React.useState("°C");

  return (
    <>
      <SetSectionHead title="Display" />
      <SetPanel>
        <View
          style={{
            paddingTop: SPACE[3],
            paddingHorizontal: SPACE[3],
            paddingBottom: withUnits ? SPACE[2] : SPACE[3],
          }}
        >
          <Text
            style={[
              resolveTypeStyle(t, "kpiLabel"),
              { fontSize: 9, color: t.textSoft, marginBottom: 8 },
            ]}
          >
            Theme
          </Text>
          <View style={{ flexDirection: "row", gap: SPACE[2] }}>
            <Choice
              name="System"
              sub="Auto"
              selected={isSystem}
              onPress={(): void => setTheme(osThemeName)}
              Icon={IconSystem}
            />
            <Choice
              name="Solarpunk"
              sub="Light"
              selected={!isSystem && themeName === "solarpunk"}
              onPress={(): void => setTheme("solarpunk")}
              Icon={IconSun}
            />
            <Choice
              name="Sovereign"
              sub="Dark"
              selected={!isSystem && themeName === "sovereign"}
              onPress={(): void => setTheme("sovereign")}
              Icon={IconMoon}
            />
          </View>
        </View>

        {withUnits ? (
          <>
            <View style={{ height: 1, backgroundColor: t.borderSoft }} />
            <View
              style={{
                padding: SPACE[3],
                gap: SPACE[3],
              }}
            >
              <UnitsRow
                label="Power"
                options={["kW", "MW"] as const}
                selected={powerUnit}
                onSelect={setPowerUnit}
              />
              <UnitsRow
                label="Temp"
                options={["°C", "°F"] as const}
                selected={tempUnit}
                onSelect={setTempUnit}
              />
            </View>
          </>
        ) : null}
      </SetPanel>
    </>
  );
}

// Suppress unused-style-import warning until further visual polish lands.
export type { Theme };
