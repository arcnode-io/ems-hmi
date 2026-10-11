/**
 * AccountSection — read-only session identity: the signed-in role and the
 * site. The device-api token carries no name or email, so neither is shown.
 */

import React, { useContext } from "react";
import { View, Text } from "react-native";
import { useTheme } from "../../../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../../../theme/tokens";
import { SPACE } from "../../../../theme/tokens/primitives";
import { useDeploymentIdentity } from "../../../../data/deployment/useDeploymentIdentity";
import { AuthContext } from "../../../../data/auth/AuthProvider";
import { ROLE_LABEL } from "../../../../data/auth/authClient";
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
        testID="account-value"
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
  // Reason: builds without login (mock/demo) run as the operator session.
  const role = useContext(AuthContext)?.role ?? "operator";
  const rows = [
    { label: "Role", value: ROLE_LABEL[role] },
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
