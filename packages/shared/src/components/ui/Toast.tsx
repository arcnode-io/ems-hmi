import type { ReactElement, ReactNode } from "react";
import {
  Toast as TamaguiToast,
  ToastProvider as TamaguiToastProvider,
  ToastViewport,
  useToastController,
  useToastState,
} from "@tamagui/toast";

interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Wrap your app with ToastProvider to enable toasts.
 * @param root0 - Component props.
 * @param root0.children - App content.
 * @returns Provider wrapper element.
 */
export function ToastProvider({ children }: ToastProviderProps): ReactElement {
  return (
    <TamaguiToastProvider swipeDirection="right" duration={4000} native={[]}>
      {children}
      <CurrentToast />
      <ToastViewport top={50} left={0} right={0} />
    </TamaguiToastProvider>
  );
}

/**
 * Renders the current toast if present.
 * @returns Toast element or null.
 */
function CurrentToast(): ReactElement | null {
  const toast = useToastState();

  if (toast === null || toast.isHandledNatively === true) {
    return null;
  }

  return (
    <TamaguiToast
      key={toast.id}
      backgroundColor="$surface"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$sm"
      padding="$sm"
      marginHorizontal="$md"
    >
      <TamaguiToast.Title color="$color" fontWeight="600">
        {toast.title}
      </TamaguiToast.Title>
      {toast.message !== undefined && (
        <TamaguiToast.Description color="$colorSecondary">
          {toast.message}
        </TamaguiToast.Description>
      )}
    </TamaguiToast>
  );
}

interface ToastController {
  show: (title: string, options?: { message?: string }) => void;
  hide: () => void;
}

/**
 * Hook to show toast notifications.
 * @returns Object with `show` function.
 * @example
 * const toast = useToast();
 * toast.show("Success!", { message: "Item saved." });
 */
export function useToast(): ToastController {
  const { show, hide } = useToastController();
  return {
    show: (title: string, options?: { message?: string }): void => {
      show(title, { message: options?.message });
    },
    hide,
  };
}
