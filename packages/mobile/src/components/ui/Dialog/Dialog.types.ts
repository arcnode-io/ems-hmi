import type { ReactNode } from "react";

/** Props for the SimpleDialog wrapper component. */
export interface SimpleDialogProps {
  /** Whether the dialog is visible */
  open: boolean;
  /** Callback when dialog requests to close */
  onClose: () => void;
  /** Dialog content */
  children: ReactNode;
  /** Optional title displayed in header */
  title?: string;
  /** Whether clicking backdrop closes dialog (default: true) */
  closeOnBackdrop?: boolean;
  /** Test ID for testing */
  testID?: string;
}
