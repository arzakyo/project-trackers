import { IRealtimeAdapter, RealtimeMessageHandler, RealtimeMessage, RealtimeDriverType } from "../types";

export class StandardWebSocketAdapter implements IRealtimeAdapter {
  readonly driverName: RealtimeDriverType = "websocket";
  private socket: WebSocket | null = null;
  private handlers: Map<string, Set<RealtimeMessageHandler>> = new Map();
  private wsUrl: string;
  private isConnecting = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(customWsUrl?: string) {
    if (customWsUrl) {
      this.wsUrl = customWsUrl;
    } else if (typeof window !== "undefined") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      this.wsUrl = `${protocol}//${window.location.host}/ws`;
    } else {
      this.wsUrl = "ws://localhost:3000/ws";
    }
  }

  connect(): void {
    if (typeof window === "undefined" || this.socket || this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        for (const topic of this.handlers.keys()) {
          this.socket?.send(JSON.stringify({ type: "subscribe", topic }));
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
          // Ignore
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
        this.socket.send(JSON.stringify({ type: "subscribe", topic }));
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
            this.socket.send(JSON.stringify({ type: "unsubscribe", topic }));
          }
        }
      }
    };
  }

  async publish<T = unknown>(topic: string, event: string, payload: T): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "publish",
          topic,
          event,
          payload,
        })
      );
    } else {
      await fetch("/api/realtime/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, event, payload }),
      });
    }
  }
}
