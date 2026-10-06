/** Public types for ConfirmationModal. Split out to avoid import cycles. */

import type React from "react";

export interface ConfirmationTarget {
  id: string;
  name: string;
  /** Current state of the target, shown so the operator can read it before confirming. */
  currentState: string;
}

export interface ConfirmationModalProps {
  visible: boolean;
  /** Human-readable command, e.g. "Discharge 1620 kW". */
  commandSummary: string;
  targetDevices: ConfirmationTarget[];
  /** Renders the SIMULATED band when true. Default false. */
  simMode?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Optional body (e.g. a value editor, or an impact line) shown above the buttons. */
  children?: React.ReactNode;
  /** Header eyebrow; default "Confirm command". An edit step uses its own (e.g. "Edit battery reserve"). */
  heading?: string;
  /** Confirm button label; default "Send". An edit step that leads to a confirmation uses "Review". */
  confirmLabel?: string;
}
