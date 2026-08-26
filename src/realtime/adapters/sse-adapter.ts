import { IRealtimeAdapter, RealtimeMessageHandler, RealtimeMessage, RealtimeDriverType } from "../types";

export class SSEAdapter implements IRealtimeAdapter {
  readonly driverName: RealtimeDriverType = "sse";
  private eventSource: EventSource | null = null;
  private handlers: Map<string, Set<RealtimeMessageHandler>> = new Map();
  private sseEndpoint: string;
  private publishEndpoint: string;

  constructor(sseEndpoint = "/api/realtime/events", publishEndpoint = "/api/realtime/publish") {
    this.sseEndpoint = sseEndpoint;
    this.publishEndpoint = publishEndpoint;
  }

  connect(): void {
    if (typeof window === "undefined" || this.eventSource) return;

    try {
      this.eventSource = new EventSource(this.sseEndpoint);

      this.eventSource.onmessage = (event) => {
        try {
          const data: RealtimeMessage = JSON.parse(event.data);
          if (data.topic && this.handlers.has(data.topic)) {
            const topicHandlers = this.handlers.get(data.topic);
            topicHandlers?.forEach((handler) => handler(data));
          }
        } catch {
          // Ignore parse errors
        }
      };

      this.eventSource.onerror = () => {
        this.disconnect();
        // Reconnect after delay
        setTimeout(() => this.connect(), 5000);
      };
    } catch {
      // Handle connection failure
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  subscribe<T = unknown>(topic: string, handler: RealtimeMessageHandler<T>): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }

    this.handlers.get(topic)!.add(handler as RealtimeMessageHandler);

    if (!this.eventSource) {
      this.connect();
    }

    return () => {
      const topicHandlers = this.handlers.get(topic);
      if (topicHandlers) {
        topicHandlers.delete(handler as RealtimeMessageHandler);
        if (topicHandlers.size === 0) {
          this.handlers.delete(topic);
        }
      }
    };
  }

  async publish<T = unknown>(topic: string, event: string, payload: T): Promise<void> {
    await fetch(this.publishEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, event, payload }),
    });
  }
}
