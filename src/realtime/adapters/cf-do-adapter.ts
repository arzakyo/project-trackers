import { IRealtimeAdapter, RealtimeMessageHandler, RealtimeMessage, RealtimeDriverType } from "../types";

export class CloudflareDOAdapter implements IRealtimeAdapter {
  readonly driverName: RealtimeDriverType = "durable-object";
  private socket: WebSocket | null = null;
  private handlers: Map<string, Set<RealtimeMessageHandler>> = new Map();
  private endpoint: string;
  private isConnecting = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(endpoint = "/api/realtime/ws") {
    this.endpoint = endpoint;
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
            const topicHandlers = this.handlers.get(data.topic);
            topicHandlers?.forEach((handler) => handler(data));
          }
        } catch {
          // Ignore non-json or status messages
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
    this.reconnectTimer = setTimeout(() => this.connect(), 3000);
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  subscribe<T = unknown>(topic: string, handler: RealtimeMessageHandler<T>): () => void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ action: "subscribe", topic }));
      }
    }

    this.handlers.get(topic)!.add(handler as RealtimeMessageHandler);

    if (!this.socket) {
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
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          action: "publish",
          topic,
          event,
          payload,
        })
      );
    } else {
      // Fallback via HTTP API if WebSocket is connecting
      await fetch("/api/realtime/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, event, payload }),
      });
    }
  }
}
