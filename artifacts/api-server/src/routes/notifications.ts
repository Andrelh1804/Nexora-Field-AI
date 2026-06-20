import { Router, type Response } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

// SSE clients map: userId -> Set of Response objects
const sseClients = new Map<number, Set<Response>>();

export function pushNotification(userId: number, notification: { type: string; title: string; message: string; data?: string }) {
  const clients = sseClients.get(userId);
  if (clients) {
    const payload = JSON.stringify(notification);
    for (const client of clients) {
      client.write(`data: ${payload}\n\n`);
    }
  }
}

// SSE endpoint
router.get("/notifications/stream", requireAuth, (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(": connected\n\n");

  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId)!.add(res);

  const keepAlive = setInterval(() => res.write(": ping\n\n"), 30000);

  req.on("close", () => {
    clearInterval(keepAlive);
    sseClients.get(userId)?.delete(res);
    if (sseClients.get(userId)?.size === 0) sseClients.delete(userId);
  });
});

// List notifications
router.get("/notifications", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const items = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, req.userId!))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json(items);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark as read
router.patch("/notifications/:id/read", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    await db.update(notificationsTable)
      .set({ read: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.userId!)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark all as read
router.patch("/notifications/read-all", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await db.update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.userId, req.userId!));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Unread count
router.get("/notifications/unread-count", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const all = await db.select().from(notificationsTable)
      .where(and(eq(notificationsTable.userId, req.userId!), eq(notificationsTable.read, false)));
    res.json({ count: all.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
