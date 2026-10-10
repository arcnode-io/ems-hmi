import type { EventRow } from "../../../../data/events/eventsApi";
import { eventLine } from "./eventLine";

const BLANK: EventRow = {
  id: 1, occurredAt: "t", type: "DER_EVENT_STATE", subject: null, actor: null,
  program: null, status: null, state: null, value: null, detail: null,
};
const row = (patch: Partial<EventRow>): EventRow => ({ ...BLANK, ...patch });
const FLOOR_MWH = 2.36;

describe("eventLine", () => {
  it("words each event the operator cares about, and hides the ones another row already says", () => {
    // Arrange — a line-constraint lifecycle as der-control-api logs it, then operator changes
    const rows = [
      row({ type: "DER_EVENT_RECEIVED", program: "DLR_LINE_CONSTRAINT", status: "ACTIVE" }),
      row({ type: "DER_EVENT_STATE", program: "DLR_LINE_CONSTRAINT", state: "ACTIVE" }),
      row({ type: "DER_EVENT_UPDATED", program: "DLR_LINE_CONSTRAINT", status: "CANCELLED" }),
      row({ type: "DER_EVENT_UPDATED", program: "DLR_LINE_CONSTRAINT", status: "ACTIVE" }),
      row({ type: "DER_EVENT_STATE", program: "DLR_LINE_CONSTRAINT", state: "IDLE" }),
      row({ type: "DER_EVENT_STATE", program: "ERCOT_FLEX", state: "PENDING" }),
      row({ type: "DER_EVENT_APPROVED", program: "ERCOT_FLEX", actor: "operator" }),
      row({ type: "DER_EVENT_REJECTED", program: "ERCOT_FLEX", actor: "operator" }),
      row({ type: "OPERATOR_RESERVE_SET", subject: "operator_reserve", value: 4_360_000, actor: "operator" }),
      row({ type: "DISPATCH_MODE_SET", subject: "dispatch_mode", detail: "MANUAL", actor: "operator" }),
    ];

    // Act
    const lines = rows.map((r) => eventLine(r, FLOOR_MWH));

    // Assert — reserve reads above minimum SoC, like the BESS tile (4.36 − 2.36)
    expect(lines).toEqual([
      null,
      "Curtailment active · Line constraint",
      "Curtailment cancelled by utility · Line constraint",
      null,
      "Curtailment ended · Line constraint",
      "Curtailment scheduled · ERCOT flex call",
      "Curtailment approved by operator · ERCOT flex call",
      "Curtailment rejected by operator · ERCOT flex call",
      "Reserve set to 2.0 MWh by operator",
      "Dispatch mode set to Manual",
    ]);
  });
});
