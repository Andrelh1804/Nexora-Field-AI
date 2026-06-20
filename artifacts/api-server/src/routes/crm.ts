import { Router, type Response } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { db } from "@workspace/db";
import { crmLeadsTable, crmActivitiesTable } from "@workspace/db";
import { eq, desc, ilike, or } from "drizzle-orm";

const router = Router();

router.get("/crm/leads", requireAuth, requireRole("admin"), async (req, res) => {
  const { q, status, limit = "50", offset = "0" } = req.query as Record<string, string>;
  let query = db.select().from(crmLeadsTable).$dynamic();
  if (status) query = query.where(eq(crmLeadsTable.status, status as any));
  if (q) query = query.where(or(ilike(crmLeadsTable.name, `%${q}%`), ilike(crmLeadsTable.company, `%${q}%`)));
  const leads = await query.orderBy(desc(crmLeadsTable.createdAt)).limit(Number(limit)).offset(Number(offset));
  res.json(leads);
});

router.post("/crm/leads", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { name, email, phone, company, position, source, estimatedValue, notes } = req.body;
  const [lead] = await db.insert(crmLeadsTable).values({ name, email, phone, company, position, source: source || "organico", estimatedValue, notes, ownerId: req.userId! }).returning();
  res.json(lead);
});

router.put("/crm/leads/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const [lead] = await db.update(crmLeadsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(crmLeadsTable.id, Number(req.params["id"]))).returning();
  res.json(lead);
});

router.delete("/crm/leads/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await db.delete(crmLeadsTable).where(eq(crmLeadsTable.id, Number(req.params["id"])));
  res.json({ ok: true });
});

router.get("/crm/leads/:id/activities", requireAuth, requireRole("admin"), async (req, res) => {
  const acts = await db.select().from(crmActivitiesTable).where(eq(crmActivitiesTable.leadId, Number(req.params["id"]))).orderBy(desc(crmActivitiesTable.createdAt));
  res.json(acts);
});

router.post("/crm/leads/:id/activities", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const [act] = await db.insert(crmActivitiesTable).values({ ...req.body, leadId: Number(req.params["id"]), userId: req.userId! }).returning();
  res.json(act);
});

export default router;
