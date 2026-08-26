import { IRealtimeAdapter, RealtimeDriverType } from "./types";
import { CloudflareDOAdapter } from "./adapters/cf-do-adapter";
import { StandardWebSocketAdapter } from "./adapters/websocket-adapter";
import { SSEAdapter } from "./adapters/sse-adapter";

export function createRealtimeAdapter(driver?: RealtimeDriverType): IRealtimeAdapter {
  const configuredDriver =
    driver ||
    (typeof process !== "undefined" && process.env?.VITE_REALTIME_DRIVER as RealtimeDriverType) ||
    "durable-object";

  switch (configuredDriver) {
    case "websocket":
      return new StandardWebSocketAdapter();
    case "sse":
      return new SSEAdapter();
    case "durable-object":
    default:
      return new CloudflareDOAdapter();
  }
}

export class RealtimeClient {
  private adapter: IRealtimeAdapter;

  constructor(adapter?: IRealtimeAdapter) {
    this.adapter = adapter || createRealtimeAdapter();
  }

  get driverName(): RealtimeDriverType {
    return this.adapter.driverName;
  }

  connect(): void {
    this.adapter.connect();
  }

  disconnect(): void {
    this.adapter.disconnect();
  }

  subscribe<T = unknown>(topic: string, handler: (message: import("./types").RealtimeMessage<T>) => void) {
    return this.adapter.subscribe(topic, handler);
  }

  publish<T = unknown>(topic: string, event: string, payload: T) {
    return this.adapter.publish(topic, event, payload);
  }
}

export const realtimeClient = new RealtimeClient();
