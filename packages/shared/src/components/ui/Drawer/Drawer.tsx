import type { ReactElement } from "react";
import { View, Text, useTheme } from "@tamagui/core";
import { TouchableOpacity, Pressable } from "react-native";
import { X } from "@tamagui/lucide-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ROUTES, type RootStackParamList } from "../../../navigation";

const DRAWER_WIDTH = 280;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Side drawer menu with overlay using React Navigation.
 * @param props - Component props.
 * @param props.open - Whether drawer is visible.
 * @param props.onClose - Close handler.
 * @returns Drawer element or null.
 */
export function Drawer({ open, onClose }: DrawerProps): ReactElement | null {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const iconColor = String(theme.color?.val ?? "#000");
  const primaryColor = String(theme.primary?.val ?? "#007AFF");

  if (!open) {
    return null;
  }

  return (
    <View
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={100}
    >
      {/* Overlay */}
      <Pressable
        onPress={onClose}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      />

      {/* Drawer Panel */}
      <View
        position="absolute"
        top={0}
        left={0}
        bottom={0}
        width={DRAWER_WIDTH}
        backgroundColor="$background"
        borderRightWidth={1}
        borderRightColor="$borderColor"
      >
        {/* Header */}
        <View
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          paddingHorizontal="$md"
          paddingVertical="$md"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <Text
            color="$color"
            fontSize={20}
            fontWeight="700"
            fontFamily="$body"
          >
            Menu
          </Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <X size={24} color={iconColor} />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View paddingVertical="$sm">
          {ROUTES.map((item) => {
            const isActive = route.name === item.name;
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.name}
                onPress={() => {
                  navigation.navigate(item.name);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View
                  flexDirection="row"
                  alignItems="center"
                  gap="$sm"
                  paddingHorizontal="$md"
                  paddingVertical="$sm"
                  backgroundColor={isActive ? "$surface" : "transparent"}
                  borderLeftWidth={isActive ? 3 : 0}
                  borderLeftColor="$primary"
                >
                  <Icon size={20} color={isActive ? primaryColor : iconColor} />
                  <Text
                    color={isActive ? "$primary" : "$color"}
                    fontSize={16}
                    fontWeight={isActive ? "600" : "400"}
                    fontFamily="$body"
                  >
                    {item.title}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export type { DrawerProps };
