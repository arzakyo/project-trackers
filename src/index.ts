import { auth } from "./lib/auth";
import { RealtimeRoomDO } from "./realtime/cf-durable-object";

export { RealtimeRoomDO };

export interface Env {
  ASSETS: Fetcher;
  REALTIME_ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. Route Better Auth endpoints: /api/auth/*
    if (url.pathname.startsWith("/api/auth")) {
      return auth.handler(request);
    }

    // 2. Route Cloudflare Durable Object Realtime WebSocket endpoint: /api/realtime/ws
    if (url.pathname === "/api/realtime/ws") {
      const upgradeHeader = request.headers.get("Upgrade");
      if (upgradeHeader === "websocket") {
        // Route to singleton or room-based Durable Object
        const id = env.REALTIME_ROOM.idFromName("global_room");
        const stub = env.REALTIME_ROOM.get(id);
        return stub.fetch(request);
      }
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    // 3. Route Realtime HTTP Publish fallback: /api/realtime/publish
    if (url.pathname === "/api/realtime/publish" && request.method === "POST") {
      try {
        const body = (await request.json()) as Record<string, unknown>;
        const id = env.REALTIME_ROOM.idFromName("global_room");
        const stub = env.REALTIME_ROOM.get(id);
        // Forward publish request to Durable Object
        return stub.fetch(
          new Request(new URL("/api/realtime/ws", request.url), {
            method: "POST",
            body: JSON.stringify({ action: "publish", ...(body || {}) }),
          })
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: "Publish failed" }), { status: 400 });
      }
    }

    // 4. Serve static assets & web application
    return env.ASSETS.fetch(request);
  },
};
