import { View, Text } from "react-native";
import type { ReactElement } from "react";
import { useTheme } from "@ems-hmi/shared/theme/ThemeProvider";

/**
 * App root — placeholder until routes + screens land on mobile.
 */
function App(): ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: t.text,
          fontFamily: t.fontHeading,
          fontSize: 32,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        ARCNODE EMS
      </Text>
      <Text
        style={{
          color: t.textSoft,
          fontFamily: t.fontLabel,
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
