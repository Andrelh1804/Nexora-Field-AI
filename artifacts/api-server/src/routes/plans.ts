import { Router, type Response } from "express";
import { db, plansTable, subscriptionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

// List all plans
router.get("/plans", async (_req, res) => {
  try {
    const plans = await db.select().from(plansTable).where(eq(plansTable.active, true));
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get my subscription
router.get("/subscriptions/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [sub] = await db
      .select({
        id: subscriptionsTable.id,
        userId: subscriptionsTable.userId,
        planId: subscriptionsTable.planId,
        status: subscriptionsTable.status,
        currentPeriodEnd: subscriptionsTable.currentPeriodEnd,
        createdAt: subscriptionsTable.createdAt,
        planName: plansTable.name,
        planSlug: plansTable.slug,
        planPrice: plansTable.price,
        planTarget: plansTable.target,
        planFeatures: plansTable.features,
      })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .where(eq(subscriptionsTable.userId, req.userId!))
      .limit(1);
    res.json(sub || null);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Subscribe to a plan (simulated — no real Stripe yet)
router.post("/subscriptions", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.body;
    const [plan] = await db.select().from(plansTable).where(and(eq(plansTable.id, planId), eq(plansTable.active, true))).limit(1);
    if (!plan) { res.status(404).json({ error: "Plan not found" }); return; }

    // Cancel existing
    await db.update(subscriptionsTable)
      .set({ status: "cancelada", canceledAt: new Date() })
      .where(and(eq(subscriptionsTable.userId, req.userId!), eq(subscriptionsTable.status, "ativa")));

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const [sub] = await db.insert(subscriptionsTable).values({
      userId: req.userId!,
      planId,
      status: "ativa",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    }).returning();
    res.status(201).json(sub);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cancel subscription
router.delete("/subscriptions/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await db.update(subscriptionsTable)
      .set({ status: "cancelada", canceledAt: new Date() })
      .where(and(eq(subscriptionsTable.userId, req.userId!), eq(subscriptionsTable.status, "ativa")));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
