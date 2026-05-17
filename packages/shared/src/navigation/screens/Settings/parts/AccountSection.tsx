/**
 * AccountSection — read-only operator + site identity. Real auth (and an
 * edit/sign-out flow) lands when the reverse-proxy auth contract is wired
 * per the analyst-agent backend handoff.
 */

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
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

export function AccountSection(): React.ReactElement {
  const identity = useDeploymentIdentity();
  // TODO: real auth → operator + email + role come from the proxy headers
  // (X-Operator-Id / X-Role) per analyst-agent handoff. Stubbed below
  // with the same chrome user so the visual contract holds for demo.
  const rows = [
    { label: "Display name", value: "R. Marquez" },
    { label: "Email", value: "r.marquez@arcnode.io" },
    { label: "Role", value: "Lead Operator" },
    { label: "Site", value: identity.name },
  ];
  return (
    <>
      <SetSectionHead title="Account" />
      <SetPanel>
        {rows.map((r, i) => (
          <Row
            key={r.label}
            label={r.label}
            value={r.value}
            showDivider={i > 0}
          />
        ))}
      </SetPanel>
    </>
  );
}
