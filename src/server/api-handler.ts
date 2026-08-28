import type { Connect } from "vite";
import type { ServerResponse } from "node:http";
import { prisma } from "../db/prisma.ts";
import { auth } from "../lib/auth.ts";

// Set of connected SSE clients across all browsers & devices
const sseClients = new Set<ServerResponse>();

export function broadcastRealtime(topic: string, event: string, payload: unknown) {
  const data = JSON.stringify({
    topic,
    event,
    payload,
    timestamp: Date.now(),
  });

  const msg = `data: ${data}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(msg);
    } catch {
      sseClients.delete(client);
    }
  }
}

export function createApiMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost:3000"}`);

    // Helper: JSON response
    const sendJson = (data: unknown, status = 200) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    };

    // Helper: Read JSON Body
    const readBody = async (): Promise<Record<string, unknown> | Array<Record<string, unknown>>> => {
      return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (e) {
            reject(e);
          }
        });
      });
    };

    // -------------------------------------------------------------------------
    // 1. Better Auth Handler (/api/auth/*)
    // -------------------------------------------------------------------------
    if (url.pathname.startsWith("/api/auth")) {
      try {
        const bodyText = req.method !== "GET" && req.method !== "HEAD"
          ? JSON.stringify(await readBody())
          : undefined;

        const headers = new Headers();
        Object.entries(req.headers).forEach(([key, val]) => {
          if (val !== undefined) {
            headers.set(key, Array.isArray(val) ? val.join(", ") : val);
          }
        });

        const webRequest = new Request(url.href, {
          method: req.method,
          headers,
          body: bodyText,
        });

        const authResponse = await auth.handler(webRequest);
        res.statusCode = authResponse.status;
        authResponse.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });

        const respText = await authResponse.text();
        res.end(respText);
        return;
      } catch (err: unknown) {
        console.error("Auth handler error:", err);
        sendJson({ error: (err as Error).message || "Auth error" }, 500);
        return;
      }
    }

    // -------------------------------------------------------------------------
    // 2. Realtime SSE Stream Endpoint (/api/realtime/events)
    // -------------------------------------------------------------------------
    if (url.pathname === "/api/realtime/events" && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });

      res.write(`data: ${JSON.stringify({ topic: "system", event: "CONNECTED", timestamp: Date.now() })}\n\n`);
      sseClients.add(res);

      const keepAliveInterval = setInterval(() => {
        try {
          res.write(": keepalive\n\n");
        } catch {
          clearInterval(keepAliveInterval);
          sseClients.delete(res);
        }
      }, 20000);

      req.on("close", () => {
        clearInterval(keepAliveInterval);
        sseClients.delete(res);
      });
      return;
    }

    // -------------------------------------------------------------------------
    // 3. Realtime Publish Endpoint (/api/realtime/publish)
    // -------------------------------------------------------------------------
    if (url.pathname === "/api/realtime/publish" && req.method === "POST") {
      try {
        const body = (await readBody()) as Record<string, unknown>;
        const topic = String(body.topic || "project:trackers");
        const event = String(body.event || "MESSAGE");
        const payload = body.payload;

        broadcastRealtime(topic, event, payload);
        sendJson({ success: true, timestamp: Date.now() });
        return;
      } catch (err: unknown) {
        sendJson({ error: "Failed to publish realtime event" }, 500);
        return;
      }
    }

    // -------------------------------------------------------------------------
    // 4. Trackers API (/api/trackers)
    // -------------------------------------------------------------------------
    if (url.pathname === "/api/trackers") {
      try {
        // GET /api/trackers - List all items
        if (req.method === "GET") {
          const items = await prisma.trackerItem.findMany({
            orderBy: [{ order: "asc" }, { createdAt: "desc" }],
          });
          sendJson(items);
          return;
        }

        // POST /api/trackers - Bulk replace or create item
        if (req.method === "POST") {
          const body = await readBody();

          if (Array.isArray(body)) {
            // Bulk replace/import
            await prisma.trackerItem.deleteMany({});
            const created = await Promise.all(
              body.map((item: Record<string, unknown>, idx: number) =>
                prisma.trackerItem.create({
                  data: {
                    id: String(item.id || `F-${String(idx + 1).padStart(3, "0")}`),
                    type: String(item.type || "feature"),
                    title: String(item.title || "Untitled"),
                    desc: String(item.desc || ""),
                    priority: String(item.priority || "high"),
                    status: String(item.status || "planned"),
                    owner: String(item.owner || ""),
                    blocked: String(item.blocked || ""),
                    version: String(item.version || ""),
                    notes: String(item.notes || ""),
                    archived: Boolean(item.archived),
                    order: Number(item.order) || idx * 10,
                  },
                })
              )
            );

            broadcastRealtime("project:trackers", "BOARD_UPDATED", created);
            sendJson(created, 201);
            return;
          }

          // Single item create
          const newItem = await prisma.trackerItem.create({
            data: {
              id: String(body.id),
              type: String(body.type || "feature"),
              title: String(body.title || "Untitled"),
              desc: String(body.desc || ""),
              priority: String(body.priority || "high"),
              status: String(body.status || "planned"),
              owner: String(body.owner || ""),
              blocked: String(body.blocked || ""),
              version: String(body.version || ""),
              notes: String(body.notes || ""),
              archived: Boolean(body.archived),
              order: Number(body.order) || 0,
            },
          });

          broadcastRealtime("project:trackers", "ITEM_SAVED", newItem);
          sendJson(newItem, 201);
          return;
        }
      } catch (err: unknown) {
        console.error("Trackers API error:", err);
        sendJson({ error: (err as Error).message || "Failed to process tracker items" }, 500);
        return;
      }
    }

    // Single item operations: /api/trackers/:id
    if (url.pathname.startsWith("/api/trackers/")) {
      const id = decodeURIComponent(url.pathname.replace("/api/trackers/", ""));
      try {
        // PUT /api/trackers/:id - Update item with Optimistic Concurrency Control (OCC)
        if (req.method === "PUT") {
          const body = (await readBody()) as Record<string, unknown>;
          const existing = await prisma.trackerItem.findUnique({ where: { id } });

          if (!existing) {
            sendJson({ error: "Item not found" }, 404);
            return;
          }

          // Optimistic Concurrency Control Check:
          if (body.clientUpdatedAt) {
            const clientDate = new Date(String(body.clientUpdatedAt)).getTime();
            const dbDate = new Date(existing.updatedAt).getTime();
            if (dbDate > clientDate + 1000) {
              sendJson(
                {
                  error: "CONCURRENCY_CONFLICT",
                  message: "Another user has updated this item in the background.",
                  currentItem: existing,
                },
                409
              );
              return;
            }
          }

          const updated = await prisma.trackerItem.update({
            where: { id },
            data: {
              type: body.type !== undefined ? String(body.type) : existing.type,
              title: body.title !== undefined ? String(body.title) : existing.title,
              desc: body.desc !== undefined ? String(body.desc) : existing.desc,
              priority: body.priority !== undefined ? String(body.priority) : existing.priority,
              status: body.status !== undefined ? String(body.status) : existing.status,
              owner: body.owner !== undefined ? String(body.owner) : existing.owner,
              blocked: body.blocked !== undefined ? String(body.blocked) : existing.blocked,
              version: body.version !== undefined ? String(body.version) : existing.version,
              notes: body.notes !== undefined ? String(body.notes) : existing.notes,
              archived: body.archived !== undefined ? Boolean(body.archived) : existing.archived,
              order: body.order !== undefined ? Number(body.order) : existing.order,
            },
          });

          broadcastRealtime("project:trackers", "ITEM_SAVED", updated);
          sendJson(updated);
          return;
        }

        // DELETE /api/trackers/:id
        if (req.method === "DELETE") {
          await prisma.trackerItem.delete({ where: { id } });
          broadcastRealtime("project:trackers", "ITEM_DELETED", { id });
          sendJson({ success: true, id });
          return;
        }
      } catch (err: unknown) {
        console.error(`Trackers API item ${id} error:`, err);
        sendJson({ error: (err as Error).message || "Failed to update item" }, 500);
        return;
      }
    }

    // -------------------------------------------------------------------------
    // 5. Users API (/api/users)
    // -------------------------------------------------------------------------
    if (url.pathname === "/api/users") {
      try {
        if (req.method === "GET") {
          const users = await prisma.user.findMany({
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              image: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
          });
          sendJson(users);
          return;
        }
      } catch (err: unknown) {
        console.error("Users API error:", err);
        sendJson({ error: (err as Error).message || "Failed to fetch users" }, 500);
        return;
      }
    }

    // -------------------------------------------------------------------------
    // 6. Owners API (/api/owners)
    // -------------------------------------------------------------------------
    if (url.pathname === "/api/owners") {
      try {
        // GET /api/owners - Returns all owners (registered users + custom board owners)
        if (req.method === "GET") {
          const hasBoardOwner = Boolean(prisma && "boardOwner" in prisma && prisma.boardOwner);

          const [users, customOwners] = await Promise.all([
            prisma.user.findMany({
              select: { id: true, name: true, email: true },
              orderBy: { createdAt: "asc" },
            }),
            hasBoardOwner
              ? prisma.boardOwner.findMany({ orderBy: { createdAt: "asc" } })
              : Promise.resolve([]),
          ]);

          // Seed default team owners if empty
          if (hasBoardOwner && customOwners.length === 0) {
            const defaults = ["Tim IT Dominus4d", "Tim IT Live Chat", "Tim Nova"];
            await Promise.all(
              defaults.map((name) =>
                prisma.boardOwner.upsert({
                  where: { name },
                  update: {},
                  create: { name, isUser: false },
                })
              )
            );
          }

          const freshCustomOwners = hasBoardOwner && customOwners.length === 0
            ? await prisma.boardOwner.findMany({ orderBy: { createdAt: "asc" } })
            : customOwners;

          const defaultFallbackTeam = ["Tim IT Dominus4d", "Tim IT Live Chat", "Tim Nova"];
          const teamNames = freshCustomOwners.length > 0
            ? freshCustomOwners.map((o) => o.name)
            : defaultFallbackTeam;

          const userOwners = users.map((u) => ({
            name: u.name || u.email,
            email: u.email,
            id: u.id,
            isUser: true,
          }));

          const teamOwners = teamNames.map((name, i) => ({
            name,
            id: `team-${i}`,
            isUser: false,
          }));

          sendJson({
            owners: Array.from(new Set([...userOwners.map((u) => u.name), ...teamNames])),
            users: userOwners,
            customOwners: teamOwners,
          });
          return;
        }

        // POST /api/owners - Add a new board owner
        if (req.method === "POST") {
          const body = (await readBody()) as Record<string, unknown>;
          const name = String(body.name || "").trim();

          if (!name) {
            sendJson({ error: "Owner name is required" }, 400);
            return;
          }

          const hasBoardOwner = Boolean(prisma && "boardOwner" in prisma && prisma.boardOwner);
          if (hasBoardOwner) {
            const created = await prisma.boardOwner.upsert({
              where: { name },
              update: {},
              create: { name, isUser: false },
            });
            broadcastRealtime("project:trackers", "OWNERS_UPDATED", { action: "add", name });
            sendJson(created, 201);
            return;
          }

          broadcastRealtime("project:trackers", "OWNERS_UPDATED", { action: "add", name });
          sendJson({ name, isUser: false }, 201);
          return;
        }

        // DELETE /api/owners - Remove a custom owner
        if (req.method === "DELETE") {
          const body = (await readBody()) as Record<string, unknown>;
          const queryName = url.searchParams.get("name");
          const name = String(body.name || queryName || "").trim();

          if (!name) {
            sendJson({ error: "Owner name is required" }, 400);
            return;
          }

          const hasBoardOwner = Boolean(prisma && "boardOwner" in prisma && prisma.boardOwner);
          if (hasBoardOwner) {
            await prisma.boardOwner.deleteMany({
              where: { name },
            });
          }

          broadcastRealtime("project:trackers", "OWNERS_UPDATED", { action: "remove", name });
          sendJson({ success: true, name });
          return;
        }
      } catch (err: unknown) {
        console.error("Owners API error:", err);
        sendJson({ error: (err as Error).message || "Failed to process owners" }, 500);
        return;
      }
    }

    next();
  };
}
