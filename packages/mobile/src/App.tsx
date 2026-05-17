import { View, Text } from "react-native";
import type { ReactElement } from "react";
import { useTheme } from "@ems-hmi/shared/theme/ThemeProvider";

/**
 * App root — placeholder until routes + screens land on mobile.
 * @returns View element with the placeholder banner
 */
function App(): ReactElement {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: theme.text,
          fontFamily: theme.fontHeading,
          fontSize: 32,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        ARCNODE EMS
      </Text>
      <Text
        style={{
          color: theme.textSoft,
          fontFamily: theme.fontLabel,
          fontSize: 10,
          letterSpacing: 0.18,
          marginTop: 8,
          textTransform: "uppercase",
        }}
      >
        Pixel-port in progress
      </Text>
    </View>
  );
}

export default App;
