import { Dialog as TamaguiDialog } from "@tamagui/dialog";
import type { ReactElement } from "react";
import type { SimpleDialogProps } from "./Dialog.types";
import {
  StyledOverlay,
  StyledContent,
  DialogHeader,
  CloseButton,
} from "./Dialog.styles";

/**
 * Simple dialog wrapper matching previous Modal API.
 * @param root0 - Component props.
 * @param root0.open - Whether dialog is visible.
 * @param root0.onClose - Close handler.
 * @param root0.children - Dialog content.
 * @param root0.title - Optional dialog title.
 * @param root0.closeOnBackdrop - Close on backdrop tap.
 * @returns Dialog element.
 */
export function SimpleDialog({
  open,
  onClose,
  children,
  title,
  closeOnBackdrop = true,
}: SimpleDialogProps): ReactElement {
  return (
    <TamaguiDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <TamaguiDialog.Portal>
        <StyledOverlay
          key="overlay"
          onPress={closeOnBackdrop ? onClose : undefined}
        />
        <StyledContent key="content">
          {title !== undefined && title !== "" && (
            <DialogHeader>
              <TamaguiDialog.Title>{title}</TamaguiDialog.Title>
              <TamaguiDialog.Close asChild>
                <CloseButton onPress={onClose}>×</CloseButton>
              </TamaguiDialog.Close>
            </DialogHeader>
          )}
          {children}
        </StyledContent>
      </TamaguiDialog.Portal>
    </TamaguiDialog>
  );
}

/**
 * Re-export Tamagui Dialog with custom styled components.
 * Use Dialog compound components for full control,
 * or SimpleDialog for a drop-in Modal replacement.
 */
export const Dialog = Object.assign(TamaguiDialog, {
  Overlay: StyledOverlay,
  Content: StyledContent,
  Header: DialogHeader,
});
