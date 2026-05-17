/**
 * ModulesScreen — `/modules` route. Lists every device-0 module with status,
 * alarm count, and 3 live metrics. Tap a card → device detail.
 *
 * Composition: SldCta → FilterRow → ModuleCard[].
 */

import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../../theme/ThemeProvider";
import { SPACE } from "../../../theme/tokens/primitives";
import type { RootStackParamList } from "../../routes";
import { ModuleCard, type ModuleType } from "../../../components/composed/ModuleCard/ModuleCard";
import { SldCta } from "./parts/SldCta";
import { FilterRow, type FilterOption } from "./parts/FilterRow";
import { useModuleRows } from "./useModuleRows";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTER_DEFS: readonly { id: string; label: string; matches: (mt: ModuleType) => boolean }[] = [
  { id: "all", label: "All", matches: () => true },
  { id: "bess", label: "BESS", matches: (mt) => mt === "bess" },
  { id: "compute", label: "Compute", matches: (mt) => mt === "compute" },
  { id: "grid", label: "Grid", matches: (mt) => mt === "grid" },
  { id: "thermal", label: "Thermal", matches: (mt) => mt === "thermal" },
];

export function ModulesScreen(): React.ReactElement {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const rows = useModuleRows();
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = useMemo(() => {
    const def = FILTER_DEFS.find((f) => f.id === activeFilter);
    if (!def) return rows;
    return rows.filter((r) => def.matches(r.moduleType));
  }, [rows, activeFilter]);

  const filterOptions: FilterOption[] = FILTER_DEFS.map((d) => ({
    id: d.id,
    label: d.label,
    count: rows.filter((r) => d.matches(r.moduleType)).length,
  }));

  return (
    <ScrollView
      dataSet={{ comp: "ModulesScreen" }}
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingBottom: SPACE[3] }}
    >
      <SldCta onPress={(): void => nav.navigate("Sld")} />
      <FilterRow
        options={filterOptions}
        activeId={activeFilter}
        onSelect={setActiveFilter}
      />
      <View
        style={{
          marginHorizontal: SPACE[4],
          marginTop: SPACE[3],
          gap: SPACE[3],
        }}
      >
        {filtered.map((r) => (
          <ModuleCard
            key={r.id}
            moduleType={r.moduleType}
            displayName={r.displayName}
            sub={r.sub}
            status={r.status}
            alarmCount={r.alarmCount}
            measurements={r.measurements}
            onPress={(): void => nav.navigate("DeviceDetail", { deviceId: r.id })}
          />
        ))}
      </View>
    </ScrollView>
  );
}
