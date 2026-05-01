import type { ReactElement } from "react";
import { NavigationContainer } from "@react-navigation/native";
import type { LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./routes";

const Stack = createNativeStackNavigator<RootStackParamList>();

interface NavigatorProps {
  HomeScreen: () => ReactElement;
  ChatScreen: () => ReactElement;
  SettingsScreen: () => ReactElement;
  linking: LinkingOptions<RootStackParamList>;
}

/**
 * Main app navigator. Linking config is platform-specific so it's passed in.
 * @param props - Screen components and linking config.
 * @param props.HomeScreen - Component for the home/dashboard screen.
 * @param props.ChatScreen - Component for the AI chat screen.
 * @param props.SettingsScreen - Component for the settings screen.
 * @param props.linking - Platform-specific linking config (URLs on web, deep links on mobile).
 * @returns NavigationContainer with stack navigator.
 */
export function Navigator({
  HomeScreen,
  ChatScreen,
  SettingsScreen,
  linking,
}: NavigatorProps): ReactElement {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
