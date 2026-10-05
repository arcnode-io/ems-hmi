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
  /** Optional editor (e.g. a value input) shown above Send — confirm what you edit, in one step. */
  children?: React.ReactNode;
}
