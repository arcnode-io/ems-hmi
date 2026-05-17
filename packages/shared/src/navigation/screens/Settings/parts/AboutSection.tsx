/**
 * AboutSection — version + build + site identifiers + "Report a problem"
 * affordance. Read-only.
 */

import React from "react";
import { Platform, View, Text, Pressable } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE, RADIUS } from "../../../../theme/tokens/primitives";
import { useDeploymentIdentity } from "../../../../data/deployment/useDeploymentIdentity";
import { SetPanel, SetSectionHead } from "./SetPanel";

interface RowProps {
  label: string;
  value: string;
  showDivider: boolean;
}

function Row({ label, value, showDivider }: RowProps): React.ReactElement {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: SPACE[2] + 2,
        paddingHorizontal: SPACE[3],
        borderTopWidth: showDivider ? 1 : 0,
        borderTopColor: t.borderSoft,
      }}
    >
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          {
            fontSize: 11,
            color: t.textSoft,
            letterSpacing: 0.12,
            fontWeight: "600",
            textTransform: "uppercase",
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          { fontSize: 12, color: t.text, fontWeight: "600", letterSpacing: 0.02 },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function AboutSection(): React.ReactElement {
  const t = useTheme();
  const identity = useDeploymentIdentity();
  const isWeb = Platform.OS === "web";
  // Build constants today are inlined; wire to package.json + a build-time
  // env var when CI is ready to inject them.
  const rows = [
    { label: "EMS version", value: "v0.7.2" },
    { label: "App version", value: isWeb ? "Web · 1.0.0" : "1.0.0 (build 142)" },
    { label: "Site ID", value: identity.host },
  ];
  return (
    <>
      <SetSectionHead title="About" />
      <SetPanel>
        {rows.map((r, i) => (
          <Row key={r.label} label={r.label} value={r.value} showDivider={i > 0} />
        ))}
        <View
          style={{
            paddingVertical: SPACE[2],
            paddingHorizontal: SPACE[3],
            borderTopWidth: 1,
            borderTopColor: t.borderSoft,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Report a problem"
            style={{
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: RADIUS[2],
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: "transparent",
            }}
          >
            <Text
              style={[
                resolveTypeStyle(t, "label"),
                {
                  fontSize: 11,
                  fontWeight: "600",
                  color: t.textMid,
                  letterSpacing: 0.1,
                },
              ]}
            >
              Report a problem ›
            </Text>
          </Pressable>
        </View>
      </SetPanel>
    </>
  );
}
