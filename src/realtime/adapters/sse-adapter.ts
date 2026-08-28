import { IRealtimeAdapter, RealtimeMessageHandler, RealtimeMessage, RealtimeDriverType } from "../types";

export class SSEAdapter implements IRealtimeAdapter {
  readonly driverName: RealtimeDriverType = "sse";
  private eventSource: EventSource | null = null;
  private channel: BroadcastChannel | null = null;
  private handlers: Map<string, Set<RealtimeMessageHandler>> = new Map();
  private sseEndpoint: string;
  private publishEndpoint: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(sseEndpoint = "/api/realtime/events", publishEndpoint = "/api/realtime/publish") {
    this.sseEndpoint = sseEndpoint;
    this.publishEndpoint = publishEndpoint;

    // Cross-tab local channel
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel("project_trackers_realtime");
      this.channel.onmessage = (event) => {
        try {
          const message: RealtimeMessage = event.data;
          if (message && message.topic && this.handlers.has(message.topic)) {
            this.handlers.get(message.topic)?.forEach((handler) => handler(message));
          }
        } catch {}
      };
    }
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
          // Ignore keepalives or non-json
        }
      };

      this.eventSource.onerror = () => {
        this.disconnect();
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), 4000);
      };
    } catch {}
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  subscribe<T = unknown>(topic: string, handler: RealtimeMessageHandler<T>): () => void {
    let topicHandlers = this.handlers.get(topic);
    if (!topicHandlers) {
      topicHandlers = new Set();
      this.handlers.set(topic, topicHandlers);
    }
    topicHandlers.add(handler as RealtimeMessageHandler);

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
    const message: RealtimeMessage<T> = {
      topic,
      event,
      payload,
      timestamp: Date.now(),
    };

    // 1. Post to local tabs
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch {}
    }

    // 2. Publish to server to broadcast to all other users / devices via SSE
    try {
      await fetch(this.publishEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, event, payload }),
      });
    } catch {}
  }
}
