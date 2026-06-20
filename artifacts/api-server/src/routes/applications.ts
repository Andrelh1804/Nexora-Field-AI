import { Router, type Response } from "express";
import { db, applicationsTable, techniciansTable, serviceOrdersTable, companiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { sql } from "drizzle-orm";

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
