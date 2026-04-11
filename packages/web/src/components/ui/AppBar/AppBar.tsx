import type { ReactElement, ReactNode } from "react";
import { View, Text, useTheme } from "@tamagui/core";
import { Menu } from "@tamagui/lucide-icons";
import { TouchableOpacity } from "react-native";

interface AppBarProps {
  title: string;
  onMenuPress: () => void;
  rightAction?: ReactNode;
}

/**
 * Top app bar with hamburger menu, title, and optional right action.
 * @param root0 - Component props.
 * @param root0.title - Screen title.
 * @param root0.onMenuPress - Menu button handler.
 * @param root0.rightAction - Optional right element.
 * @returns AppBar element.
 */
export function AppBar({
  title,
  onMenuPress,
  rightAction,
}: AppBarProps): ReactElement {
  const theme = useTheme();
  const iconColor = String(theme.color?.val ?? "#000");

  return (
    <View
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      backgroundColor="$surface"
      paddingHorizontal="$md"
      paddingVertical="$sm"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <TouchableOpacity onPress={onMenuPress} activeOpacity={0.7}>
        <View padding="$xs">
          <Menu size={24} color={iconColor} />
        </View>
      </TouchableOpacity>

      <Text color="$color" fontSize={18} fontWeight="600" fontFamily="$body">
        {title}
      </Text>

      <View width={32}>{rightAction}</View>
    </View>
  );
}

export type { AppBarProps };
