import type { ReactElement, ReactNode } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./routes";
import { LINKING_CONFIG } from "./routes";

const Stack = createNativeStackNavigator<RootStackParamList>();

interface NavigatorProps {
  HomeScreen: () => ReactElement;
  ChatScreen: () => ReactElement;
  SettingsScreen: () => ReactElement;
  children?: ReactNode;
}

/**
 * Main app navigator with URL/history support.
 * @param props - Screen components to render for each route.
 * @param props.HomeScreen - Component for the home/dashboard screen.
 * @param props.ChatScreen - Component for the AI chat screen.
 * @param props.SettingsScreen - Component for the settings screen.
 * @returns NavigationContainer with stack navigator.
 */
export function Navigator({
  HomeScreen,
  ChatScreen,
  SettingsScreen,
}: NavigatorProps): ReactElement {
  return (
    <NavigationContainer linking={LINKING_CONFIG}>
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
