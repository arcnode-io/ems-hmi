import { useState } from "react";
import type { ReactElement } from "react";
import { Platform, TouchableOpacity } from "react-native";
import { View } from "@tamagui/core";
import { Popover } from "@tamagui/popover";
import { useThemeSwitcher } from "../../../theme/TamaguiThemeProvider";
import { THEME_NAME, type ThemeName } from "../../../theme/theme.types";
import { ThemedText } from "../../ui/ThemedText";

const THEME_OPTIONS: ThemeName[] = Object.values(THEME_NAME);
// React Native portal positioning differs from web
const POPOVER_OFFSET = Platform.OS === "web" ? 0 : -47;

/**
 * Theme picker component for switching between available themes.
 * @returns Theme picker UI
 */
export function ThemePicker(): ReactElement {
  const { theme, setTheme } = useThemeSwitcher();
  const [open, setOpen] = useState(false);

  const handleSelect = (themeName: ThemeName): void => {
    setTheme(themeName);
    setOpen(false);
  };

  return (
    <View flexDirection="row" gap="$sm" padding="$sm" alignItems="center">
      <ThemedText color="$colorSecondary" fontSize={14} fontWeight="400">
        Theme:
      </ThemedText>
      <Popover
        open={open}
        onOpenChange={setOpen}
        placement="bottom-start"
        offset={POPOVER_OFFSET}
      >
        <Popover.Trigger asChild>
          <TouchableOpacity
            testID="theme-select-trigger"
            onPress={() => setOpen(!open)}
          >
            <View
              paddingHorizontal="$sm"
              paddingVertical="$xs"
              borderWidth={2}
              borderColor="$borderColor"
              backgroundColor="$surface"
              minWidth={120}
            >
              <ThemedText fontSize={12} fontWeight="500" color="$color">
                {theme}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </Popover.Trigger>
        <Popover.Content
          borderWidth={2}
          borderColor="$borderColor"
          backgroundColor="$surface"
          padding="$xs"
        >
          {THEME_OPTIONS.map((themeName) => (
            <TouchableOpacity
              key={themeName}
              onPress={() => handleSelect(themeName)}
            >
              <View
                testID={`theme-option-${themeName}`}
                paddingHorizontal="$sm"
                paddingVertical="$xs"
                backgroundColor={theme === themeName ? "$primary" : "$surface"}
              >
                <ThemedText
                  fontSize={12}
                  fontWeight="500"
                  color={theme === themeName ? "$background" : "$color"}
                >
                  {themeName}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </Popover.Content>
      </Popover>
    </View>
  );
}
