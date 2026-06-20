import { Router, type Response } from "express";
import { db, serviceEvidencesTable, techniciansTable, serviceOrdersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

// List evidences for a service order
router.get("/service-orders/:id/evidences", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params["id"] as string);
    const evidences = await db
      .select()
      .from(serviceEvidencesTable)
      .where(eq(serviceEvidencesTable.serviceOrderId, orderId));
    res.json(evidences);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add evidence (URL-based; accepts base64 data URI or hosted URL)
router.post("/service-orders/:id/evidences", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params["id"] as string);
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    if (!tech) {
      res.status(403).json({ error: "Technician profile required" });
      return;
    }
    const [order] = await db.select().from(serviceOrdersTable).where(eq(serviceOrdersTable.id, orderId)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Service order not found" });
      return;
    }
    const { category, type, url, filename, description } = req.body;
    const [evidence] = await db.insert(serviceEvidencesTable).values({
      serviceOrderId: orderId,
      technicianId: tech.id,
      category,
      type: type || "foto",
      url,
      filename: filename || "evidencia",
      description,
    }).returning();
    res.status(201).json(evidence);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete evidence
router.delete("/evidences/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    if (!tech) { res.status(403).json({ error: "Forbidden" }); return; }
    await db.delete(serviceEvidencesTable)
      .where(and(eq(serviceEvidencesTable.id, id), eq(serviceEvidencesTable.technicianId, tech.id)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
