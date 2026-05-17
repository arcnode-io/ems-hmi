/**
 * MqttProvider — React Context that hands a MqttClient impl to descendants.
 * Both RealMqttProvider and MockMqttProvider wrap this with their own client.
 *
 * Consumers don't access the client directly — they use useSubscription<T>(topic).
 */

import React, { createContext } from "react";
import type { MqttClient } from "./MqttClient";

export const MqttClientContext = createContext<MqttClient | null>(null);

interface MqttProviderProps {
  client: MqttClient;
  children: React.ReactNode;
}

/**
 * Provide a MqttClient impl to the subtree.
 * @param props client + children
 * @param props.client A MqttClient implementation (real or mock)
 * @param props.children Subtree that consumes via useSubscription
 * @returns Context provider element
 */
export function MqttProvider({
  client,
  children,
}: MqttProviderProps): React.ReactElement {
  return (
    <MqttClientContext.Provider value={client}>
      {children}
    </MqttClientContext.Provider>
  );
}
