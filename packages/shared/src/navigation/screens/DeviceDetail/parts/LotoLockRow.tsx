/**
 * LotoLockRow — one active lock: holder, permit, age, and (operators only) a
 * two-step Clear for THAT lock alone. Clearing never touches anyone else's.
 */

import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import type { Lock } from "../../../../data/loto/lotoApi";
import { relativeAge } from "../../Overview/parts/relativeAge";

interface LotoLockRowProps {
  lock: Lock;
  /** null for viewers — no Clear button at all. */
  onClear: (() => Promise<void>) | null;
}

function SmallButton({ label, a11y, onPress, tone }: { label: string; a11y?: string; onPress: () => void; tone: string }): React.ReactElement {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y ?? label}
      onPress={onPress}
      style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS[2], borderWidth: 1, borderColor: tone }}
    >
      <Text style={[resolveTypeStyle(t, "label"), { color: tone, fontWeight: "600" }]}>{label}</Text>
    </Pressable>
  );
}

export function LotoLockRow({ lock, onClear }: LotoLockRowProps): React.ReactElement {
  const t = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detail = [lock.permit_ref, `locked ${relativeAge(lock.set_at)}`].filter((part) => part !== null).join(" · ");

  const clear = (): void => {
    if (onClear === null) return;
    setConfirming(false);
    onClear().catch((err: unknown) => setError(err instanceof Error ? err.message : "Couldn't clear the lock."));
  };

  return (
    <View
      dataSet={{ comp: "LotoLockRow" }}
      style={{ flexDirection: "row", alignItems: "center", gap: SPACE[3], paddingVertical: SPACE[2], borderTopWidth: 1, borderTopColor: t.borderSoft }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text testID="loto-active-holder" style={[resolveTypeStyle(t, "bodyDense"), { color: t.text, fontWeight: "700" }]}>
          {lock.holder_name}
        </Text>
        <Text style={[resolveTypeStyle(t, "caption"), { color: t.textMid }]}>{detail}</Text>
        {error === null ? null : <Text style={[resolveTypeStyle(t, "caption"), { color: t.statusAlarm }]}>{error}</Text>}
      </View>
      {onClear === null ? null : confirming ? (
        <View style={{ flexDirection: "row", gap: SPACE[2] }}>
          <SmallButton label="Cancel" onPress={() => setConfirming(false)} tone={t.textMid} />
          <SmallButton label="Confirm clear" onPress={clear} tone={t.statusLoto} />
        </View>
      ) : (
        <SmallButton label="Clear" a11y={`Clear ${lock.holder_name}'s lock`} onPress={() => setConfirming(true)} tone={t.statusLoto} />
      )}
    </View>
  );
}
