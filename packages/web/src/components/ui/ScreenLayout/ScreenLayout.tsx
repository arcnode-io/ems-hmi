import { useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { useRoute } from "@react-navigation/native";
import { ScreenWrapper, AppBar, Drawer } from "../index";
import { ROUTES } from "../../../navigation";

interface ScreenLayoutProps {
  children: ReactNode;
}

/**
 * Common screen layout with AppBar and Drawer navigation.
 * Uses current route to determine title from ROUTES config.
 * @param props - Component props.
 * @param props.children - Screen content.
 * @returns Screen layout with navigation chrome.
 */
export function ScreenLayout({ children }: ScreenLayoutProps): ReactElement {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const route = useRoute();
  const routeConfig = ROUTES.find((config) => config.name === route.name);
  const title = routeConfig?.title ?? route.name;

  return (
    <ScreenWrapper>
      <AppBar title={title} onMenuPress={() => setDrawerOpen(true)} />
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {children}
    </ScreenWrapper>
  );
}
