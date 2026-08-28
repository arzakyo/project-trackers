import { IRealtimeAdapter, RealtimeMessageHandler, RealtimeMessage, RealtimeDriverType } from "../types";

export class CloudflareDOAdapter implements IRealtimeAdapter {
  readonly driverName: RealtimeDriverType = "durable-object";
  private socket: WebSocket | null = null;
  private channel: BroadcastChannel | null = null;
  private handlers: Map<string, Set<RealtimeMessageHandler>> = new Map();
  private endpoint: string;
  private isConnecting = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(endpoint = "/api/realtime/ws") {
    this.endpoint = endpoint;

    // Cross-tab BroadcastChannel for 100% instant local synchronization
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
    if (typeof window === "undefined" || this.socket || this.isConnecting) return;
    this.isConnecting = true;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}${this.endpoint}`;

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnecting = false;
        // Resubscribe active topics upon reconnect
        for (const topic of this.handlers.keys()) {
          this.socket?.send(JSON.stringify({ action: "subscribe", topic }));
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data: RealtimeMessage = JSON.parse(event.data);
          if (data.topic && this.handlers.has(data.topic)) {
            this.handlers.get(data.topic)?.forEach((handler) => handler(data));
          }
        } catch {
          // Ignore non-json or ping messages
        }
      };

      this.socket.onclose = () => {
        this.socket = null;
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(), 5000);
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
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
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ action: "subscribe", topic }));
      }
    }
    topicHandlers.add(handler as RealtimeMessageHandler);

    if (!this.socket && !this.isConnecting) {
      this.connect();
    }

    return () => {
      const topicHandlers = this.handlers.get(topic);
      if (topicHandlers) {
        topicHandlers.delete(handler as RealtimeMessageHandler);
        if (topicHandlers.size === 0) {
          this.handlers.delete(topic);
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ action: "unsubscribe", topic }));
          }
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

    // 1. Broadcast across all tabs via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch {}
    }

    // 2. Publish to Cloudflare Durable Object WebSocket if open
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(
          JSON.stringify({
            action: "publish",
            topic,
            event,
            payload,
          })
        );
        return;
      } catch {}
    }

    // 3. Fallback via server API
    try {
      await fetch("/api/realtime/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, event, payload }),
      });
    } catch {}
  }
}
