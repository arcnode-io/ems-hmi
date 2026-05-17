/**
 * ConnectionPanel — platform-aware EMS-connection card.
 *
 *   - Native (Platform.OS !== "web"): editable Host/IP + primary "Test
 *     Connection" button. The IP is what the APK uses to reach the EMS.
 *   - Web (Platform.OS === "web"): the user reached this URL, so the
 *     endpoint is read-only and the action is a diagnostic "Re-test".
 *
 * Both modes render the same TestResultRow list below the action.
 * Connection-test plumbing lives in [[useConnectionTest]] — today it
 * only probes the Analyst API (the only service we actually call).
 */

import React, { useState } from "react";
import { Platform, View, Text, Pressable, TextInput } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { useDeploymentIdentity } from "../../../../data/deployment/useDeploymentIdentity";
import { useConnectionTest } from "../../../../data/connection/useConnectionTest";
import { SetPanel, SetSectionHead } from "./SetPanel";
import { TestResultRow } from "./TestResultRow";

export function ConnectionPanel(): React.ReactElement {
  const t = useTheme();
  const identity = useDeploymentIdentity();
  const isWeb = Platform.OS === "web";
  const { results, testing, run } = useConnectionTest();
  // Local-only override; backend wiring of the IP edit lands when the
  // Android APK build target ships. For web it's read-only anyway.
  const [hostDraft, setHostDraft] = useState(identity.host);

  return (
    <>
      <SetSectionHead title="EMS Connection" />
      <SetPanel>
        <View
          style={{
            paddingTop: SPACE[3],
            paddingHorizontal: SPACE[3],
            paddingBottom: SPACE[2],
          }}
        >
          <Text
            style={[
              resolveTypeStyle(t, "kpiLabel"),
              { fontSize: 9, color: t.textSoft, marginBottom: 6 },
            ]}
          >
            {isWeb ? "Endpoint" : "Host / IP"}
          </Text>
          {isWeb ? (
            <Text
              numberOfLines={1}
              style={[
                resolveTypeStyle(t, "label"),
                { fontSize: 14, color: t.text, fontWeight: "600" },
              ]}
            >
              {identity.host}
            </Text>
          ) : (
            <TextInput
              value={hostDraft}
              onChangeText={setHostDraft}
              placeholder="192.168.1.100"
              placeholderTextColor={t.textSoft}
              style={{
                paddingVertical: 9,
                paddingHorizontal: 11,
                backgroundColor: t.bg,
                borderWidth: 1,
                borderColor: t.border,
                borderRadius: RADIUS[2],
                fontFamily: t.fontLabel,
                fontSize: 14,
                color: t.text,
                letterSpacing: 0.02,
              }}
            />
          )}
        </View>

        {/* Native gets a primary CTA; web gets a low-key Re-test below the rows */}
        {!isWeb ? (
          <View
            style={{
              paddingTop: SPACE[2],
              paddingHorizontal: SPACE[3],
              paddingBottom: SPACE[3],
              borderTopWidth: 1,
              borderTopColor: t.borderSoft,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Test connection"
              onPress={(): void => {
                void run();
              }}
              disabled={testing}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: RADIUS[2],
                backgroundColor: t.accent,
                opacity: testing ? 0.6 : 1,
                alignItems: "center",
              }}
            >
              <Text
                style={[
                  resolveTypeStyle(t, "label"),
                  {
                    color: "#fff",
                    fontWeight: "700",
                    letterSpacing: 0.18,
                    textTransform: "uppercase",
                    fontSize: 11,
                  },
                ]}
              >
                {testing ? "Testing…" : "Test Connection"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {results.map((r, i) => (
          <TestResultRow key={r.name} result={r} showDivider={i > 0 || !isWeb} />
        ))}

        {isWeb ? (
          <View
            style={{
              paddingTop: SPACE[2],
              paddingHorizontal: SPACE[3],
              paddingBottom: SPACE[3],
              borderTopWidth: 1,
              borderTopColor: t.borderSoft,
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Re-test connection"
              onPress={(): void => {
                void run();
              }}
              disabled={testing}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 12,
                borderRadius: RADIUS[2],
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: "transparent",
                opacity: testing ? 0.6 : 1,
              }}
            >
              <Text
                style={[
                  resolveTypeStyle(t, "label"),
                  {
                    color: t.textMid,
                    fontWeight: "700",
                    letterSpacing: 0.15,
                    textTransform: "uppercase",
                    fontSize: 10,
                  },
                ]}
              >
                {testing ? "Testing…" : "Re-test"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </SetPanel>
    </>
  );
}
