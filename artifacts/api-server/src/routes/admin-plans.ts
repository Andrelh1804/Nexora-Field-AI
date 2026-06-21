import { Router, type Response } from "express";
import { db, plansTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/admin/plans", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const plans = await db.select().from(plansTable).orderBy(asc(plansTable.sortOrder));
    res.json(plans);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/admin/plans", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description, target, price, maxOrders, features, highlighted, active, sortOrder } = req.body;

    if (!name || !slug || !target) {
      res.status(400).json({ error: "name, slug e target são obrigatórios." });
      return;
    }

    const [existing] = await db.select({ id: plansTable.id }).from(plansTable).where(eq(plansTable.slug, slug)).limit(1);
    if (existing) { res.status(400).json({ error: "Slug já em uso." }); return; }

    const [plan] = await db.insert(plansTable).values({
      name,
      slug,
      description,
      target,
      price: price ?? 0,
      maxOrders: maxOrders || null,
      features: Array.isArray(features) ? features : [],
      highlighted: highlighted ?? false,
      active: active ?? true,
      sortOrder: sortOrder ?? 0,
    }).returning();

    res.status(201).json(plan);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.patch("/admin/plans/:id", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const { name, slug, description, target, price, maxOrders, features, highlighted, active, sortOrder } = req.body;

    const updates: Partial<typeof plansTable.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (target !== undefined) updates.target = target;
    if (price !== undefined) updates.price = price;
    if (maxOrders !== undefined) updates.maxOrders = maxOrders;
    if (features !== undefined) updates.features = Array.isArray(features) ? features : [];
    if (highlighted !== undefined) updates.highlighted = highlighted;
    if (active !== undefined) updates.active = active;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;

    const [plan] = await db.update(plansTable).set(updates).where(eq(plansTable.id, id)).returning();
    if (!plan) { res.status(404).json({ error: "Plano não encontrado." }); return; }
    res.json(plan);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.delete("/admin/plans/:id", requireAuth, requireRole("admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    await db.delete(plansTable).where(eq(plansTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

export default router;
