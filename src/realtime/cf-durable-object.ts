import { DurableObject } from "cloudflare:workers";

interface ClientAttachment {
  topics: Set<string>;
}

export class RealtimeRoomDO extends DurableObject {
  private sessions: Map<WebSocket, ClientAttachment> = new Map();

  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept WebSocket connection
    this.ctx.acceptWebSocket(server);
    this.sessions.set(server, { topics: new Set() });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = JSON.parse(message.toString());
      const session = this.sessions.get(ws) || { topics: new Set() };
      this.sessions.set(ws, session);

      switch (data.action) {
        case "subscribe":
          if (data.topic) {
            session.topics.add(data.topic);
            ws.send(JSON.stringify({ status: "subscribed", topic: data.topic }));
          }
          break;

        case "unsubscribe":
          if (data.topic) {
            session.topics.delete(data.topic);
            ws.send(JSON.stringify({ status: "unsubscribed", topic: data.topic }));
          }
          break;

        case "publish":
          if (data.topic && data.event) {
            const outgoingPayload = JSON.stringify({
              topic: data.topic,
              event: data.event,
              payload: data.payload,
              timestamp: Date.now(),
            });

            // Broadcast to all connected clients subscribed to this topic
            for (const [clientWs, clientSession] of this.sessions.entries()) {
              if (clientSession.topics.has(data.topic)) {
                try {
                  clientWs.send(outgoingPayload);
                } catch (e) {
                  // Handle send failure / stale sockets
                }
              }
            }
          }
          break;

        default:
          ws.send(JSON.stringify({ error: "Unknown action" }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ error: "Invalid JSON format" }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    this.sessions.delete(ws);
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    this.sessions.delete(ws);
  }
}
