export type RealtimeDriverType = "durable-object" | "websocket" | "sse";

export interface RealtimeMessage<T = unknown> {
  topic: string;
  event: string;
  payload: T;
  timestamp: number;
}

export type RealtimeMessageHandler<T = unknown> = (message: RealtimeMessage<T>) => void;

export interface IRealtimeAdapter {
  readonly driverName: RealtimeDriverType;
  connect(): void;
  disconnect(): void;
  subscribe<T = unknown>(topic: string, handler: RealtimeMessageHandler<T>): () => void;
  publish<T = unknown>(topic: string, event: string, payload: T): Promise<void>;
}
