/**
 * LotoPanel — lockout/tagout on a module's detail screen: who holds a lock,
 * add your own, clear one, and the device's lock history. LOTO is a STATE,
 * not an alarm — no ack anywhere. Group lockout: the device stays locked
 * while any lock stands. Operators write; viewers see the same list, no
 * buttons. The gateway refuses writes to a locked device; this panel only
 * tells people about it.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { useLoto } from "../../../../data/loto/useLoto";
import { LotoLockRow } from "./LotoLockRow";
import { LockForm } from "./LockForm";
import { LotoHistory } from "./LotoHistory";

function stateLine(own: number, locked: boolean): string {
  if (own > 0) {
    const who = own === 1 ? "1 person" : `${own} people`;
    return `Locked out by ${who}. Commands to this device and everything under it are refused.`;
  }
  // Reason: in locked_devices with no lock of its own = locked through a parent.
  return locked ? "Locked out with the equipment above it. Commands are refused." : "Not locked out.";
}

export function LotoPanel({ deviceId }: { deviceId: string }): React.ReactElement {
  const t = useTheme();
  const loto = useLoto();
  const own = loto.locks.filter((l) => l.device_id === deviceId);
  const locked = loto.lockedDevices.has(deviceId);

  return (
    <View
      dataSet={{ comp: "LotoPanel" }}
      style={{
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: locked ? `${t.statusLoto}88` : t.border,
        borderRadius: RADIUS[3],
        overflow: "hidden",
      }}
    >
      <View style={{ paddingVertical: SPACE[2], paddingHorizontal: SPACE[3], borderBottomWidth: 1, borderBottomColor: t.borderSoft }}>
        <Text style={[resolveTypeStyle(t, "cardHeading"), { color: t.text, fontSize: 13 }]}>Lockout / tagout</Text>
      </View>
      <View style={{ padding: SPACE[3], gap: SPACE[3] }}>
        <Text testID="loto-state" style={[resolveTypeStyle(t, "bodyDense"), { color: locked ? t.statusLoto : t.textMid }]}>
          {loto.status === "error" ? "Couldn't read lockout state." : stateLine(own.length, locked)}
        </Text>
        {own.length === 0 ? null : (
          <View>
            {own.map((lock) => (
              <LotoLockRow key={lock.id} lock={lock} onClear={loto.canWrite ? () => loto.clear(lock.id) : null} />
            ))}
          </View>
        )}
        {loto.canWrite ? (
          <LockForm onLock={(req) => loto.lock(deviceId, req)} />
        ) : (
          <Text style={[resolveTypeStyle(t, "caption"), { color: t.textSoft }]}>Only operators can set or clear locks.</Text>
        )}
        <LotoHistory deviceId={deviceId} />
      </View>
    </View>
  );
}
