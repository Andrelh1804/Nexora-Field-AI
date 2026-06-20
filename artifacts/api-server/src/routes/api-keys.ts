import { Router, type Response } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { db } from "@workspace/db";
import { apiKeysTable, webhooksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

router.get("/developer/keys", requireAuth, async (req: AuthRequest, res: Response) => {
  const keys = await db.select().from(apiKeysTable).where(eq(apiKeysTable.userId, req.userId!));
  res.json(keys.map(k => ({ ...k, keyHash: undefined })));
});

router.post("/developer/keys", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, scopes, expiresAt } = req.body;
  const rawKey = `nxr_${crypto.randomBytes(32).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.substring(0, 12);
  const [key] = await db.insert(apiKeysTable).values({ userId: req.userId!, name, keyHash, keyPrefix, scopes: scopes || ["read"], expiresAt: expiresAt ? new Date(expiresAt) : undefined }).returning();
  res.json({ ...key, rawKey });
});

router.delete("/developer/keys/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  await db.delete(apiKeysTable).where(eq(apiKeysTable.id, Number(req.params["id"])));
  res.json({ ok: true });
});

router.get("/developer/webhooks", requireAuth, async (req: AuthRequest, res: Response) => {
  const hooks = await db.select().from(webhooksTable).where(eq(webhooksTable.userId, req.userId!));
  res.json(hooks.map(h => ({ ...h, secret: undefined })));
});

router.post("/developer/webhooks", requireAuth, async (req: AuthRequest, res: Response) => {
  const { url, events } = req.body;
  const secret = crypto.randomBytes(24).toString("hex");
  const [hook] = await db.insert(webhooksTable).values({ userId: req.userId!, url, events: events || [], secret }).returning();
  res.json({ ...hook, secret });
});

router.delete("/developer/webhooks/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  await db.delete(webhooksTable).where(eq(webhooksTable.id, Number(req.params["id"])));
  res.json({ ok: true });
});

export default router;
