/**
 * LockForm — an operator adds THEIR OWN lock (group lockout: one per person).
 * holder_name is typed because v1 accounts are role-shared and can't name a
 * person; permit_ref is optional.
 */

import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { LoginField } from "../../Login/LoginField";
import type { LockRequest } from "../../../../data/loto/lotoApi";

const MAX_TEXT = 120;

interface LockFormProps {
  /** Resolves on success; rejects with an Error whose message the operator reads. */
  onLock: (req: LockRequest) => Promise<void>;
}

export function LockForm({ onLock }: LockFormProps): React.ReactElement {
  const t = useTheme();
  const [holder, setHolder] = useState("");
  const [permit, setPermit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (): void => {
    const name = holder.trim();
    if (name === "") {
      setError("Enter the name of the person holding the lock.");
      return;
    }
    if (name.length > MAX_TEXT || permit.trim().length > MAX_TEXT) {
      setError(`Keep each field to ${MAX_TEXT} characters.`);
      return;
    }
    setBusy(true);
    setError(null);
    onLock({ holder_name: name, permit_ref: permit.trim() === "" ? null : permit.trim() }).then(
      () => {
        setBusy(false);
        setHolder("");
        setPermit("");
      },
      (err: unknown) => {
        setBusy(false);
        setError(err instanceof Error ? err.message : "Couldn't add the lock.");
      },
    );
  };

  return (
    <View dataSet={{ comp: "LockForm" }} style={{ gap: SPACE[2], maxWidth: 420 }}>
      <LoginField label="Your name" value={holder} onChangeText={setHolder} testID="loto-holder" onSubmitEditing={submit} />
      <LoginField
        label="Permit / work order (optional)"
        value={permit}
        onChangeText={setPermit}
        testID="loto-permit"
        onSubmitEditing={submit}
      />
      {error === null ? null : (
        <Text style={[resolveTypeStyle(t, "caption"), { color: t.statusAlarm }]}>{error}</Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        dataSet={{ action: "loto-lock" }}
        disabled={busy}
        onPress={submit}
        style={{
          alignSelf: "flex-start",
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: RADIUS[2],
          backgroundColor: t.statusLoto,
          opacity: busy ? 0.5 : 1,
        }}
      >
        <Text style={[resolveTypeStyle(t, "label"), { color: t.surface, fontWeight: "700" }]}>Add my lock</Text>
      </Pressable>
    </View>
  );
}
