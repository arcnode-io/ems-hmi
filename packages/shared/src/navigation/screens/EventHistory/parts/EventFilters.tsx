/**
 * EventFilters — the event history page's search: chip rows for kind, program
 * (curtailments only) and time range. Each change refetches server-side.
 */

import React from "react";
import { View } from "react-native";
import { FilterRow } from "../../Modules/parts/FilterRow";
import type { EventFilter } from "../../../../data/events/eventFilter";

const KINDS = [
  { id: "all", label: "All" },
  { id: "curtailment", label: "Curtailment" },
  { id: "reserve", label: "Reserve" },
  { id: "dispatch", label: "Dispatch mode" },
] as const satisfies readonly { id: EventFilter["kind"]; label: string }[];

const PROGRAMS = [
  { id: "all", label: "All programs" },
  { id: "DLR_LINE_CONSTRAINT", label: "Line constraint" },
  { id: "ERCOT_FLEX", label: "ERCOT flex call" },
] as const satisfies readonly { id: EventFilter["program"]; label: string }[];

const RANGES = [
  { id: "24h", label: "Last 24 h" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
] as const satisfies readonly { id: EventFilter["range"]; label: string }[];

/** Narrow a chip id back to its option (FilterRow speaks plain strings). */
function pick<T extends { id: string }>(options: readonly T[], id: string): T["id"] {
  const found = options.find((option) => option.id === id);
  if (found === undefined) throw new Error(`unknown filter option: ${id}`);
  return found.id;
}

interface EventFiltersProps {
  filter: EventFilter;
  onChange: (filter: EventFilter) => void;
}

export function EventFilters({ filter, onChange }: EventFiltersProps): React.ReactElement {
  return (
    <View dataSet={{ comp: "EventFilters" }}>
      <FilterRow
        options={KINDS}
        activeId={filter.kind}
        // Reason: program only narrows DER rows — drop it when leaving curtailments.
        onSelect={(id) => onChange({ ...filter, kind: pick(KINDS, id), program: "all" })}
      />
      {filter.kind === "curtailment" ? (
        <FilterRow
          options={PROGRAMS}
          activeId={filter.program}
          onSelect={(id) => onChange({ ...filter, program: pick(PROGRAMS, id) })}
        />
      ) : null}
      <FilterRow options={RANGES} activeId={filter.range} onSelect={(id) => onChange({ ...filter, range: pick(RANGES, id) })} />
    </View>
  );
}
