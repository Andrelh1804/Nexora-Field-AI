import { Router, type Response } from "express";
import { db, serviceOrdersTable, companiesTable, techniciansTable, applicationsTable } from "@workspace/db";
import { eq, and, ilike } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { sql } from "drizzle-orm";

const router = Router();

async function enrichOrder(order: typeof serviceOrdersTable.$inferSelect) {
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, order.companyId)).limit(1);
  let assignedTechnician = null;
  if (order.assignedTechnicianId) {
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, order.assignedTechnicianId)).limit(1);
    assignedTechnician = tech || null;
  }
  return { ...order, company: company || null, assignedTechnician };
}

router.get("/service-orders", async (req, res) => {
  try {
    const { status, category, city, state } = req.query as Record<string, string>;
    let baseQuery = db.select().from(serviceOrdersTable);
    const conditions = [];
    if (status) conditions.push(eq(serviceOrdersTable.status, status as any));
    if (category) conditions.push(eq(serviceOrdersTable.category, category as any));
    if (city) conditions.push(ilike(serviceOrdersTable.city, `%${city}%`));
    if (state) conditions.push(ilike(serviceOrdersTable.state, `%${state}%`));
    const orders = conditions.length > 0
      ? await baseQuery.where(and(...conditions)).orderBy(sql`${serviceOrdersTable.createdAt} DESC`)
      : await baseQuery.orderBy(sql`${serviceOrdersTable.createdAt} DESC`);
    const enriched = await Promise.all(orders.map(enrichOrder));
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/service-orders", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [company] = await db.select().from(companiesTable).where(eq(companiesTable.userId, req.userId!)).limit(1);
    if (!company) {
      res.status(403).json({ error: "Company profile required" });
      return;
    }
    const { title, description, category, city, state, address, value, sla } = req.body;
    const [order] = await db.insert(serviceOrdersTable).values({
      companyId: company.id,
      title,
      description,
      category,
      city,
      state,
      address,
      value,
      sla,
      status: "aberto",
    }).returning();
    await db.update(companiesTable).set({ totalOrders: company.totalOrders + 1 }).where(eq(companiesTable.id, company.id));
    const enriched = await enrichOrder(order);
    res.status(201).json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/service-orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [order] = await db.select().from(serviceOrdersTable).where(eq(serviceOrdersTable.id, id)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Service order not found" });
      return;
    }
    const enriched = await enrichOrder(order);
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/service-orders/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [order] = await db.select().from(serviceOrdersTable).where(eq(serviceOrdersTable.id, id)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const updates: Partial<typeof serviceOrdersTable.$inferInsert> = {};
    const fields = ["title", "description", "category", "city", "state", "address", "value", "sla", "status", "observations", "assignedTechnicianId"] as const;
    for (const f of fields) {
      if (req.body[f] !== undefined) (updates as any)[f] = req.body[f];
    }
    const [updated] = await db.update(serviceOrdersTable).set(updates).where(eq(serviceOrdersTable.id, id)).returning();
    const enriched = await enrichOrder(updated);
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/service-orders/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    await db.delete(serviceOrdersTable).where(eq(serviceOrdersTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/service-orders/:id/match", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [order] = await db.select().from(serviceOrdersTable).where(eq(serviceOrdersTable.id, id)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const allTechs = await db.select().from(techniciansTable);
    const scored = allTechs
      .map(tech => {
        let score = 50;
        if (tech.specialties.includes(order.category)) score += 30;
        if (tech.city.toLowerCase() === order.city.toLowerCase()) score += 15;
        if (tech.state.toLowerCase() === order.state.toLowerCase()) score += 5;
        if (tech.rating) score = Math.min(100, score + (tech.rating - 3) * 5);
        score = Math.min(100, Math.max(10, score));
        const reasons = [];
        if (tech.specialties.includes(order.category)) reasons.push(`Especialidade em ${order.category}`);
        if (tech.city.toLowerCase() === order.city.toLowerCase()) reasons.push(`Localizado em ${order.city}`);
        if (tech.rating && tech.rating >= 4) reasons.push(`Avaliação alta: ${tech.rating.toFixed(1)}`);
        return {
          technician: tech,
          score: Math.round(score),
          reasoning: reasons.length > 0 ? reasons.join(". ") : "Técnico disponível na região",
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    res.json(scored);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
