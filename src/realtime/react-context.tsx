import React, { createContext, useContext, useEffect, useMemo, useCallback } from "react";
import { RealtimeClient, realtimeClient as defaultClient } from "./client";
import { RealtimeMessage, RealtimeMessageHandler } from "./types";

interface RealtimeContextValue {
  client: RealtimeClient;
  driverName: string;
  publish: <T = unknown>(topic: string, event: string, payload: T) => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export interface RealtimeProviderProps {
  children: React.ReactNode;
  client?: RealtimeClient;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({
  children,
  client = defaultClient,
}) => {
  useEffect(() => {
    client.connect();
    return () => {
      client.disconnect();
    };
  }, [client]);

  const publish = useCallback(
    <T = unknown,>(topic: string, event: string, payload: T) => {
      return client.publish(topic, event, payload);
    },
    [client]
  );

  const value = useMemo(
    () => ({
      client,
      driverName: client.driverName,
      publish,
    }),
    [client, publish]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}

export function useRealtimeChannel<T = unknown>(
  topic: string,
  onMessage: RealtimeMessageHandler<T>
): void {
  const { client } = useRealtime();

  useEffect(() => {
    if (!topic) return;
    const unsubscribe = client.subscribe<T>(topic, onMessage);
    return () => {
      unsubscribe();
    };
  }, [client, topic, onMessage]);
}

export function useRealtimePublish() {
  const { publish } = useRealtime();
  return publish;
}
