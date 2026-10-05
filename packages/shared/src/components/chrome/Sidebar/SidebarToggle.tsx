/** SidebarToggle — chevron that collapses the desktop sidebar to its icon rail and back. */

import React from "react";
import { Pressable } from "react-native";
import { useTheme } from "../../../theme/ThemeProvider";
import { IconChevron } from "../../icons/IconChevron";

export function SidebarToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}): React.ReactElement {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      testID="sidebar-toggle"
      onPress={onToggle}
      style={{
        height: 36,
        alignItems: collapsed ? "center" : "flex-end",
        justifyContent: "center",
        paddingHorizontal: collapsed ? 0 : t.space[4],
        borderTopWidth: 1,
        borderTopColor: t.border,
      }}
    >
      <IconChevron size={16} color={t.textSoft} dir={collapsed ? "right" : "left"} />
    </Pressable>
  );
}
