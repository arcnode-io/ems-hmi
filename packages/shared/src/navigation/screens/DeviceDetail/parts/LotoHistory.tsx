/**
 * LotoHistory — every lock ever set on this device, newest first (GET
 * /loto/history). Re-reads whenever the site's LOTO state changes. Records,
 * not alarms: nothing to acknowledge.
 */

import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { useLoto } from "../../../../data/loto/useLoto";
import type { Lock } from "../../../../data/loto/lotoApi";
import { eventTime } from "../../EventHistory/parts/eventTime";

function span(lock: Lock): string {
  const set = `Locked ${eventTime(lock.set_at)}`;
  return lock.cleared_at === null ? `${set} · still on` : `${set} · cleared ${eventTime(lock.cleared_at)}`;
}

export function LotoHistory({ deviceId }: { deviceId: string }): React.ReactElement {
  const t = useTheme();
  const { history, revision } = useLoto();
  const [rows, setRows] = useState<Lock[] | "error" | null>(null);

  useEffect(() => {
    let current = true;
    history(deviceId).then(
      (r) => current && setRows(r),
      () => current && setRows("error"),
    );
    return (): void => {
      current = false;
    };
  }, [history, deviceId, revision]);

  const caption = resolveTypeStyle(t, "caption");
  return (
    <View dataSet={{ comp: "LotoHistory" }} style={{ gap: SPACE[1] }}>
      <Text style={[resolveTypeStyle(t, "kpiLabel"), { color: t.textSoft }]}>Lock history</Text>
      {rows === null ? (
        <Text style={[caption, { color: t.textSoft }]}>Loading…</Text>
      ) : rows === "error" ? (
        <Text style={[caption, { color: t.textSoft }]}>Couldn't load lock history.</Text>
      ) : rows.length === 0 ? (
        <Text style={[caption, { color: t.textSoft }]}>This device has never been locked out.</Text>
      ) : (
        rows.map((lock) => (
          <View key={lock.id} dataSet={{ comp: "LotoHistoryRow" }}>
            <Text style={[resolveTypeStyle(t, "bodyDense"), { color: t.text }]}>
              {lock.permit_ref === null ? lock.holder_name : `${lock.holder_name} · ${lock.permit_ref}`}
            </Text>
            <Text style={[caption, { color: t.textMid }]}>{span(lock)}</Text>
          </View>
        ))
      )}
    </View>
  );
}
