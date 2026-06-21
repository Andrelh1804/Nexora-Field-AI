import { Router, type Response } from "express";
import { db, checkinCheckoutsTable, techniciansTable, serviceOrdersTable, notificationsTable, companiesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { pushNotification } from "./notifications";
import { WhatsApp } from "../lib/whatsapp";

const router = Router();

// Get checkin/checkout for a service order
router.get("/service-orders/:id/checkin", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params["id"] as string);
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    if (!tech) { res.status(404).json({ error: "Not found" }); return; }
    const [record] = await db.select().from(checkinCheckoutsTable)
      .where(and(eq(checkinCheckoutsTable.serviceOrderId, orderId), eq(checkinCheckoutsTable.technicianId, tech.id)))
      .limit(1);
    res.json(record || null);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check-in
router.post("/service-orders/:id/checkin", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params["id"] as string);
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    if (!tech) { res.status(403).json({ error: "Technician profile required" }); return; }

    const [order] = await db.select().from(serviceOrdersTable).where(eq(serviceOrdersTable.id, orderId)).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    const { latitude, longitude, photoUrl } = req.body;
    const existing = await db.select().from(checkinCheckoutsTable)
      .where(and(eq(checkinCheckoutsTable.serviceOrderId, orderId), eq(checkinCheckoutsTable.technicianId, tech.id)))
      .limit(1);

    let record;
    if (existing.length > 0) {
      [record] = await db.update(checkinCheckoutsTable)
        .set({ checkinAt: new Date(), checkinLatitude: latitude, checkinLongitude: longitude, checkinPhotoUrl: photoUrl })
        .where(eq(checkinCheckoutsTable.id, existing[0].id))
        .returning();
    } else {
      [record] = await db.insert(checkinCheckoutsTable).values({
        serviceOrderId: orderId,
        technicianId: tech.id,
        checkinAt: new Date(),
        checkinLatitude: latitude,
        checkinLongitude: longitude,
        checkinPhotoUrl: photoUrl,
      }).returning();
    }

    // Update order status
    await db.update(serviceOrdersTable).set({ status: "em_andamento" }).where(eq(serviceOrdersTable.id, orderId));

    // Notify company
    if (order.companyId) {
      const [notif] = await db.insert(notificationsTable).values({
        userId: req.userId!,
        type: "chamado_aceito",
        title: "Check-in realizado",
        message: `Técnico fez check-in no chamado: ${order.title}`,
      }).returning();
      pushNotification(req.userId!, { ...notif, data: notif.data ?? undefined });
    }

    res.json(record);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Check-out
router.post("/service-orders/:id/checkout", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params["id"] as string);
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    if (!tech) { res.status(403).json({ error: "Technician profile required" }); return; }

    const [order] = await db.select().from(serviceOrdersTable).where(eq(serviceOrdersTable.id, orderId)).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    const { latitude, longitude, photoUrl, notes } = req.body;
    const [existing] = await db.select().from(checkinCheckoutsTable)
      .where(and(eq(checkinCheckoutsTable.serviceOrderId, orderId), eq(checkinCheckoutsTable.technicianId, tech.id)))
      .limit(1);

    if (!existing) { res.status(400).json({ error: "Check-in not found" }); return; }

    const checkinTime = existing.checkinAt;
    const checkoutTime = new Date();
    const durationMinutes = checkinTime
      ? Math.round((checkoutTime.getTime() - checkinTime.getTime()) / 60000)
      : null;

    const [record] = await db.update(checkinCheckoutsTable)
      .set({
        checkoutAt: checkoutTime,
        checkoutLatitude: latitude,
        checkoutLongitude: longitude,
        checkoutPhotoUrl: photoUrl,
        durationMinutes: durationMinutes ?? undefined,
        notes,
      })
      .where(eq(checkinCheckoutsTable.id, existing.id))
      .returning();

    // Finalize order
    await db.update(serviceOrdersTable).set({ status: "finalizado" }).where(eq(serviceOrdersTable.id, orderId));

    // Notify via plataforma
    const [notif] = await db.insert(notificationsTable).values({
      userId: req.userId!,
      type: "chamado_finalizado",
      title: "Chamado finalizado",
      message: `Checkout realizado. Duração: ${durationMinutes || "—"} minutos`,
    }).returning();
    pushNotification(req.userId!, { ...notif, data: notif.data ?? undefined });

    // WhatsApp: notificar empresa sobre conclusão
    try {
      if (order.companyId) {
        const [companyUser] = await db.select({ phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, order.companyId)).limit(1);
        if (companyUser?.phone && order.title) {
          await WhatsApp.orderCompleted(companyUser.phone, order.title, tech.name ?? "Técnico");
        }
      }
    } catch (waErr) { console.warn("[WhatsApp] checkout notification failed:", waErr); }

    res.json(record);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
