import { Router, type Response } from "express";
import { db, serviceOrdersTable, techniciansTable, dispatchHistoryTable, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { pushNotification } from "./notifications";

const router = Router();

// Score a technician against an order
function scoreTechnician(tech: typeof techniciansTable.$inferSelect, order: typeof serviceOrdersTable.$inferSelect): number {
  let score = 0;
  if (tech.specialties.includes(order.category)) score += 40;
  if (tech.state === order.state) score += 20;
  if (tech.city === order.city) score += 15;
  score += Math.min((tech.rating || 0) * 5, 15);
  score += Math.min((tech.totalServices / 10), 10);
  return Math.min(Math.round(score), 100);
}

// Trigger dispatch for a service order
router.post("/dispatch/:orderId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params["orderId"] as string);
    const [order] = await db.select().from(serviceOrdersTable).where(eq(serviceOrdersTable.id, orderId)).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (order.status !== "aberto") { res.status(400).json({ error: "Order is not open" }); return; }

    const technicians = await db.select().from(techniciansTable);
    const scored = technicians
      .map(t => ({ tech: t, score: scoreTechnician(t, order) }))
      .filter(x => x.score > 20)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Create dispatch records + notifications
    const dispatched = [];
    for (const { tech, score } of scored) {
      const [dispatch] = await db.insert(dispatchHistoryTable).values({
        serviceOrderId: orderId,
        technicianId: tech.id,
        status: "enviado",
        score,
        reason: `Score: ${score}pts — Especialidade: ${tech.specialties.join(", ")}`,
      }).returning();

      // Notify technician (via their userId)
      const [notif] = await db.insert(notificationsTable).values({
        userId: tech.userId,
        type: "convite_despacho",
        title: "Novo Chamado Disponível",
        message: `Você foi selecionado para: ${order.title} em ${order.city}/${order.state}. Score: ${score}pts`,
        data: JSON.stringify({ orderId, score }),
      }).returning();
      pushNotification(tech.userId, { ...notif, data: notif.data ?? undefined });

      dispatched.push({ dispatch, technician: { id: tech.id, name: tech.name }, score });
    }

    res.json({ orderId, dispatched, total: dispatched.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get dispatch history for an order
router.get("/dispatch/:orderId/history", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params["orderId"] as string);
    const history = await db.select().from(dispatchHistoryTable).where(eq(dispatchHistoryTable.serviceOrderId, orderId));
    res.json(history);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Accept dispatch invite
router.post("/dispatch/:orderId/accept", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params["orderId"] as string);
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    if (!tech) { res.status(403).json({ error: "Technician profile required" }); return; }

    // Update dispatch record
    await db.update(dispatchHistoryTable)
      .set({ status: "aceito", respondedAt: new Date() })
      .where(and(eq(dispatchHistoryTable.serviceOrderId, orderId), eq(dispatchHistoryTable.technicianId, tech.id)));

    // Lock order
    await db.update(serviceOrdersTable)
      .set({ status: "aceito", assignedTechnicianId: tech.id })
      .where(eq(serviceOrdersTable.id, orderId));

    // Expire other dispatches
    await db.update(dispatchHistoryTable)
      .set({ status: "expirado" })
      .where(and(eq(dispatchHistoryTable.serviceOrderId, orderId), eq(dispatchHistoryTable.status, "enviado")));

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
