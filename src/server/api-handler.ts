import type { Connect } from "vite";
import { prisma } from "../db/prisma.ts";
import { auth } from "../lib/auth.ts";

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
    // 2. Trackers API (/api/trackers)
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
          // If client sends clientUpdatedAt and existing item in DB has a newer updatedAt, return 409 Conflict!
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

          sendJson(updated);
          return;
        }

        // DELETE /api/trackers/:id
        if (req.method === "DELETE") {
          await prisma.trackerItem.delete({ where: { id } });
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
    // 3. Users API (/api/users)
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

    next();
  };
}
