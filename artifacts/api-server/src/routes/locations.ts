import { Router, type Response } from "express";
import { db, locationsTable, techniciansTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

// Update technician location
router.put("/locations/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    if (!tech) {
      res.status(404).json({ error: "Technician profile not found" });
      return;
    }
    const { latitude, longitude, city, state } = req.body;
    const existing = await db.select().from(locationsTable).where(eq(locationsTable.technicianId, tech.id)).limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(locationsTable)
        .set({ latitude, longitude, city, state })
        .where(eq(locationsTable.technicianId, tech.id))
        .returning();
      res.json(updated);
    } else {
      const [created] = await db.insert(locationsTable).values({ technicianId: tech.id, latitude, longitude, city, state }).returning();
      res.json(created);
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all technician locations (for map)
router.get("/locations/technicians", async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT l.technician_id, l.latitude, l.longitude, l.city, l.state, l.updated_at,
             t.name, t.specialties, t.rating, t.total_services, t.photo_url
      FROM locations l
      JOIN technicians t ON t.id = l.technician_id
      ORDER BY l.updated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get service orders with coordinates (for map)
router.get("/locations/orders", async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT id, title, city, state, category, status, value, address, created_at
      FROM service_orders
      WHERE status IN ('aberto', 'aceito', 'em_andamento')
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
