/**
 * RealMqttProvider — connects to the authed broker (token → broker cred → wss)
 * and provides the measurement MqttClient + the real DispatchContext. Mounted
 * only in real-broker modes, inside AuthProvider (needs the session token).
 *
 * While connecting it renders a splash; once the mqtt.js socket is handed over,
 * children mount. Mock stays the demo/local path — this never runs there.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import mqtt from "mqtt";
import { useTheme } from "../../theme/ThemeProvider";
import { resolveTypeStyle } from "../../theme/tokens";
import { useAuth } from "../auth/useAuth";
import { useDeploymentIdentity } from "../deployment/useDeploymentIdentity";
import { fetchBrokerCreds } from "../auth/brokerCreds";
import { MqttProvider } from "./MqttProvider";
import { RealMqttClient, type RawMqtt } from "./RealMqttClient";
import { resolveBrokerUrl } from "./brokerUrl";
import { brokerFallbackHost } from "./brokerHost";
import { useRealDispatch, type PublishFrame } from "./useRealDispatch";
import { DispatchContext } from "../dispatch/DispatchContext";
import type { MqttClient } from "./MqttClient";

function Splash({ text }: { text: string }): React.ReactElement {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.bg }}>
      <Text
        style={[
          resolveTypeStyle(t, "label"),
          { color: t.textSoft, letterSpacing: 0.18, textTransform: "uppercase" },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

export function RealMqttProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { token } = useAuth();
  const { deviceApiUri, host, siteId } = useDeploymentIdentity();
  const [client, setClient] = useState<MqttClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rawRef = useRef<RawMqtt | null>(null);

  useEffect(() => {
    if (token === null) return;
    let cancelled = false;
    void (async (): Promise<void> => {
      try {
        const creds = await fetchBrokerCreds(deviceApiUri, token);
        if (cancelled) return;
        const url = resolveBrokerUrl(creds.url, brokerFallbackHost(host));
        const raw = mqtt.connect(url, {
          username: creds.username,
          password: creds.password,
        }) as unknown as RawMqtt;
        rawRef.current = raw;
        setClient(new RealMqttClient(raw));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Broker connection failed");
        }
      }
    })();
    return (): void => {
      cancelled = true;
      rawRef.current?.end();
      rawRef.current = null;
    };
  }, [token, deviceApiUri, host]);

  const publishFrame = useCallback<PublishFrame>((topic, frame) => {
    rawRef.current?.publish(topic, JSON.stringify(frame), { qos: 1, retain: false });
  }, []);

  // Hook called unconditionally; it no-ops until `client` is non-null.
  const dispatch = useRealDispatch(client, publishFrame, siteId);

  if (error !== null) return <Splash text={`Broker error — ${error}`} />;
  if (client === null) return <Splash text="Connecting to broker…" />;

  return (
    <MqttProvider client={client}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </MqttProvider>
  );
}
