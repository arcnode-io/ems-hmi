import { useState } from "react";
import type { ReactElement } from "react";
import { View } from "@tamagui/core";
import { Send } from "@tamagui/lucide-icons";
import {
  Button,
  Card,
  ThemedText,
  ContentContainer,
  LineChart,
  SimpleDialog,
  Input,
  Switch,
  ToastProvider,
  useToast,
  Tooltip,
  Skeleton,
  ScreenLayout,
  AppBar,
  Drawer,
} from "./components/ui";
import { z } from "zod";
import {
  ThemePicker,
  IpAddressContainer,
  ChatContainer,
} from "./components/features";
import { Navigator } from "./navigation";

const CHART_DATA = [
  { value: 50 },
  { value: 80 },
  { value: 65 },
  { value: 90 },
  { value: 70 },
];

/**
 * Home screen with dashboard demos.
 * @returns Home screen element.
 */
function HomeScreen(): ReactElement {
  const [modalOpen, setModalOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(false);
  const toast = useToast();

  return (
    <ScreenLayout>
      <ContentContainer>
        <Button onPress={() => setModalOpen(true)} label="Open Dialog" />

        <SimpleDialog
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Dialog Demo"
        >
          <ThemedText color="$color" marginBottom="$md">
            This is a themed dialog that adapts to the current theme.
          </ThemedText>
          <Button onPress={() => setModalOpen(false)} label="Close" />
        </SimpleDialog>

        <IpAddressContainer />

        <Card>
          <ThemedText color="$color" fontWeight="500" marginBottom="$sm">
            Input Demo
          </ThemedText>
          <View flexDirection="row" alignItems="flex-end" gap="$xs">
            <View flex={1}>
              <Input
                label="Email"
                placeholder="you@example.com"
                schema={z.string().email("Please enter a valid email")}
              />
            </View>
            <View marginBottom={8}>
              <Button icon={Send} color="primary" label="" />
            </View>
          </View>
        </Card>

        <Card>
          <View
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <ThemedText color="$color" fontWeight="500">
              Switch Demo
            </ThemedText>
            <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
          </View>
        </Card>

        <Card>
          <View
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <ThemedText color="$color" fontWeight="500">
              Toast Demo
            </ThemedText>
            <Button
              label="Show Toast"
              color="secondary"
              onPress={() =>
                toast.show("Hello!", { message: "This is a toast." })
              }
            />
          </View>
        </Card>

        <Card>
          <View
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <ThemedText color="$color" fontWeight="500">
              Tooltip Demo
            </ThemedText>
            <Tooltip content="This is helpful info!">
              <Button label="Hover me" color="accent" />
            </Tooltip>
          </View>
        </Card>

        <Card>
          <ThemedText color="$color" fontWeight="500" marginBottom="$sm">
            LineChart POC
          </ThemedText>
          <LineChart data={CHART_DATA} />
        </Card>

        <Card>
          <ThemedText color="$color" fontWeight="500" marginBottom="$sm">
            Skeleton Demo
          </ThemedText>
          <View gap="$xs">
            <Skeleton variant="text" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="rect" width="100%" height={60} />
          </View>
        </Card>
      </ContentContainer>
    </ScreenLayout>
  );
}

/**
 * Settings screen with theme picker.
 * @returns Settings screen element.
 */
function SettingsScreen(): ReactElement {
  return (
    <ScreenLayout>
      <ContentContainer>
        <Card>
          <ThemedText
            color="$color"
            fontWeight="600"
            fontSize={18}
            marginBottom="$md"
          >
            Appearance
          </ThemedText>
          <ThemePicker />
        </Card>
      </ContentContainer>
    </ScreenLayout>
  );
}

/**
 * Chat screen with custom layout — no ScreenWrapper to avoid nested ScrollView with FlatList.
 * @returns Chat screen element.
 */
function ChatScreen(): ReactElement {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <View flex={1} backgroundColor="$background">
      <AppBar title="AI Chat" onMenuPress={() => setDrawerOpen(true)} />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <ChatContainer />
    </View>
  );
}

/**
 * Main app component with navigation.
 * @returns App root element with Navigator.
 */
function App(): ReactElement {
  return (
    <ToastProvider>
      <Navigator
        HomeScreen={HomeScreen}
        ChatScreen={ChatScreen}
        SettingsScreen={SettingsScreen}
      />
    </ToastProvider>
  );
}

export default App;
