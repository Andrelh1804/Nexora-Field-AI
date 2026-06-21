import { Router, type Response } from "express";
import { db, applicationsTable, techniciansTable, serviceOrdersTable, companiesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { sql } from "drizzle-orm";
import { WhatsApp } from "../lib/whatsapp";

const router = Router();

async function enrichApplication(app: typeof applicationsTable.$inferSelect) {
  const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, app.technicianId)).limit(1);
  const [order] = await db.select().from(serviceOrdersTable).where(eq(serviceOrdersTable.id, app.serviceOrderId)).limit(1);
  return { ...app, technician: tech || null, serviceOrder: order || null };
}

router.get("/service-orders/:id/applications", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const serviceOrderId = parseInt(req.params["id"] as string);
    const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.serviceOrderId, serviceOrderId));
    const enriched = await Promise.all(apps.map(enrichApplication));
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/service-orders/:id/applications", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const serviceOrderId = parseInt(req.params["id"] as string);
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, req.userId!)).limit(1);
    const techByUserId = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    const technician = techByUserId[0];
    if (!technician) {
      res.status(403).json({ error: "Technician profile required" });
      return;
    }
    const { message } = req.body;
    const [app] = await db.insert(applicationsTable).values({
      serviceOrderId,
      technicianId: technician.id,
      status: "pending",
      message,
    }).returning();
    await db.update(serviceOrdersTable)
      .set({ applicationsCount: sql`${serviceOrdersTable.applicationsCount} + 1` })
      .where(eq(serviceOrdersTable.id, serviceOrderId));
    const enriched = await enrichApplication(app);
    res.status(201).json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/applications/:id/accept", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [app] = await db.update(applicationsTable)
      .set({ status: "accepted" })
      .where(eq(applicationsTable.id, id))
      .returning();
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    await db.update(serviceOrdersTable)
      .set({ status: "aceito", assignedTechnicianId: app.technicianId })
      .where(eq(serviceOrdersTable.id, app.serviceOrderId));

    // WhatsApp: notificar técnico sobre aprovação
    try {
      const [order] = await db.select({ title: serviceOrdersTable.title, companyId: serviceOrdersTable.companyId })
        .from(serviceOrdersTable).where(eq(serviceOrdersTable.id, app.serviceOrderId)).limit(1);
      const [tech] = await db.select({ userId: techniciansTable.userId })
        .from(techniciansTable).where(eq(techniciansTable.id, app.technicianId)).limit(1);
      const [techUser] = tech ? await db.select({ phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, tech.userId)).limit(1) : [null];
      const [company] = order?.companyId ? await db.select({ razaoSocial: companiesTable.razaoSocial }).from(companiesTable).where(eq(companiesTable.userId, order.companyId)).limit(1) : [null];
      if (techUser?.phone && order?.title) {
        await WhatsApp.orderApprovedForTech(techUser.phone, order.title, company?.razaoSocial ?? "Empresa");
      }
    } catch (waErr) { console.warn("[WhatsApp] accept notification failed:", waErr); }

    const enriched = await enrichApplication(app);
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/applications/:id/reject", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [app] = await db.update(applicationsTable)
      .set({ status: "rejected" })
      .where(eq(applicationsTable.id, id))
      .returning();
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    const enriched = await enrichApplication(app);
    res.json(enriched);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
