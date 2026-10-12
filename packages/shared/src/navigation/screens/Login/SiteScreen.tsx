/**
 * SiteScreen — the native customer build's first step: which site to connect
 * to. The site's address (host name) is all the operator needs; everything
 * else comes from that site's own config file. See SiteRoot.
 */

import React, { useState } from "react";
import { LoginField } from "./LoginField";
import { CardFrame, SubmitButton } from "./CardParts";
import { GateLayout } from "./LoginScreen";

interface SiteScreenProps {
  initialAddress: string;
  /** Why the last connect failed, shown under the field. */
  error?: string;
  onConnect: (address: string) => Promise<void>;
}

export function SiteScreen({ initialAddress, error, onConnect }: SiteScreenProps): React.ReactElement {
  const [address, setAddress] = useState(initialAddress);
  const [blank, setBlank] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (): Promise<void> => {
    if (address.trim() === "") {
      setBlank(true);
      return;
    }
    setBlank(false);
    setBusy(true);
    await onConnect(address);
    setBusy(false);
  };

  return (
    <GateLayout
      comp="SiteScreen"
      label=""
      card={(fluid) => (
        <CardFrame comp="SiteCard" subtitle="Connect to your site" footer="Address from your site administrator" fluid={fluid}>
          <LoginField
            label="Site address"
            testID="site-address"
            value={address}
            onChangeText={setAddress}
            placeholder="ems.example.com"
            error={blank ? "Site address required" : error}
            autoFocus
            onSubmitEditing={submit}
          />
          <SubmitButton label="Connect" busyLabel="Connecting…" busy={busy} onPress={submit} testID="site-connect" />
        </CardFrame>
      )}
    />
  );
}
