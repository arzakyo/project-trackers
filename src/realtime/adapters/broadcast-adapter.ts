import { IRealtimeAdapter, RealtimeMessageHandler, RealtimeMessage, RealtimeDriverType } from "../types";

export class BroadcastChannelAdapter implements IRealtimeAdapter {
  readonly driverName: RealtimeDriverType = "durable-object";
  private channel: BroadcastChannel | null = null;
  private socket: WebSocket | null = null;
  private handlers: Map<string, Set<RealtimeMessageHandler>> = new Map();
  private isConnected = false;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel("project_trackers_realtime");
      this.channel.onmessage = (event) => {
        try {
          const message: RealtimeMessage = event.data;
          if (message && message.topic && this.handlers.has(message.topic)) {
            const topicHandlers = this.handlers.get(message.topic);
            topicHandlers?.forEach((h) => h(message));
          }
        } catch {}
      };
    }
  }

  connect(): void {
    if (this.isConnected) return;
    this.isConnected = true;

    // Try WebSocket connection if available
    if (typeof window !== "undefined") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${protocol}//${window.location.host}/api/realtime/ws`;
      try {
        this.socket = new WebSocket(url);
        this.socket.onmessage = (e) => {
          try {
            const data: RealtimeMessage = JSON.parse(e.data);
            if (data.topic && this.handlers.has(data.topic)) {
              this.handlers.get(data.topic)?.forEach((h) => h(data));
            }
          } catch {}
        };
      } catch {
        // Fallback gracefully to BroadcastChannel
      }
    }
  }

  disconnect(): void {
    this.isConnected = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  subscribe<T = unknown>(topic: string, handler: RealtimeMessageHandler<T>): () => void {
    let topicHandlers = this.handlers.get(topic);
    if (!topicHandlers) {
      topicHandlers = new Set();
      this.handlers.set(topic, topicHandlers);
    }
    topicHandlers.add(handler as RealtimeMessageHandler);

    if (!this.isConnected) {
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

    // 1. Broadcast locally to all active handlers in current tab
    if (this.handlers.has(topic)) {
      this.handlers.get(topic)?.forEach((h) => h(message));
    }

    // 2. Broadcast via BroadcastChannel to all other open tabs on same origin
    if (this.channel) {
      this.channel.postMessage(message);
    }

    // 3. Send over WebSocket if connected
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ action: "publish", topic, event, payload }));
      } catch {}
    }
  }
}
