/**
 * One event-history row → the sentence the card shows, or null when another
 * row already says it (RECEIVED lands the same second as its STATE row; an
 * UPDATED that isn't a cancellation changes nothing the operator sees).
 */

import { match, P } from "ts-pattern";
import type { EventRow } from "../../../../data/events/eventsApi";
import { curtailmentProgramFrom } from "../../../../data/grid/useGridState";
import { toAboveFloorMwh } from "../../../../data/bess/operatorReserve";
import { programSuffix } from "../../Grid/parts/curtailmentLine";

const WH_PER_MWH = 1_000_000;

const titleCase = (word: string): string => `${word.charAt(0)}${word.slice(1).toLowerCase()}`;

/**
 * @param row one /events row
 * @param floorMwh BESS minimum SoC in MWh — reserve reads above it, like the BESS tile
 * @example eventLine({ type: "DER_EVENT_STATE", state: "ACTIVE", program: "DLR_LINE_CONSTRAINT", … }, 2.36) // "Curtailment active · Line constraint"
 */
export function eventLine(row: EventRow, floorMwh: number): string | null {
  const program = programSuffix(row.program === null ? null : curtailmentProgramFrom(row.program));
  return match(row)
    .with({ type: "DER_EVENT_RECEIVED" }, () => null)
    .with({ type: "DER_EVENT_UPDATED", status: "CANCELLED" }, () => `Curtailment cancelled by utility${program}`)
    .with({ type: "DER_EVENT_UPDATED" }, () => null)
    .with({ type: "DER_EVENT_STATE", state: "ACTIVE" }, () => `Curtailment active${program}`)
    .with({ type: "DER_EVENT_STATE", state: "IDLE" }, () => `Curtailment ended${program}`)
    .with({ type: "DER_EVENT_STATE", state: "PENDING" }, () => `Curtailment scheduled${program}`)
    .with({ type: "DER_EVENT_STATE", state: P.string }, ({ state }) => `Curtailment ${state.toLowerCase()}${program}`)
    .with({ type: "DER_EVENT_STATE" }, () => null)
    .with({ type: "DER_EVENT_APPROVED" }, () => `Curtailment approved by operator${program}`)
    .with({ type: "DER_EVENT_REJECTED" }, () => `Curtailment rejected by operator${program}`)
    .with({ type: "OPERATOR_RESERVE_SET", value: P.number }, ({ value }) =>
      `Reserve set to ${toAboveFloorMwh(value / WH_PER_MWH, floorMwh).toFixed(1)} MWh by operator`)
    .with({ type: "OPERATOR_RESERVE_SET" }, () => null)
    .with({ type: "DISPATCH_MODE_SET", detail: P.string }, ({ detail }) => `Dispatch mode set to ${titleCase(detail)}`)
    .with({ type: "DISPATCH_MODE_SET" }, () => null)
    .exhaustive();
}
