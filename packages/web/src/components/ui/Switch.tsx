import type { ReactElement } from "react";
import { Switch as TamaguiSwitch } from "@tamagui/switch";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Theme-aware Switch toggle with sensible defaults.
 * @param root0 - Component props.
 * @param root0.checked - Current toggle state.
 * @param root0.onCheckedChange - State change handler.
 * @param root0.disabled - Disable interaction.
 * @returns Switch element.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
}: SwitchProps): ReactElement {
  return (
    <TamaguiSwitch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      width={50}
      height={28}
      backgroundColor={checked ? "$primary" : "$borderColor"}
      borderColor={checked ? "$primary" : "$borderColor"}
      opacity={disabled ? 0.5 : 1}
    >
      <TamaguiSwitch.Thumb
        width={24}
        height={24}
        backgroundColor="$background"
        borderWidth={1}
        borderColor="$borderColor"
      />
    </TamaguiSwitch>
  );
}

export type { SwitchProps };
