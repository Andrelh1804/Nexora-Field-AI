import { Router } from "express";
import { db, ratingsTable, techniciansTable, companiesTable } from "@workspace/db";
import { eq, avg } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { type Response } from "express";

const router = Router();

router.post("/ratings", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { serviceOrderId, technicianId, score, comment } = req.body;
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, technicianId)).limit(1);
    if (!tech) {
      res.status(404).json({ error: "Technician not found" });
      return;
    }
    const [companyResult] = await db.select().from(companiesTable).where(eq(companiesTable.userId, req.userId!)).limit(1);
    const companyId = companyResult?.id || 1;
    const [rating] = await db.insert(ratingsTable).values({ serviceOrderId, technicianId, companyId, score, comment }).returning();
    const allRatings = await db.select({ avg: avg(ratingsTable.score) }).from(ratingsTable).where(eq(ratingsTable.technicianId, technicianId));
    const avgScore = allRatings[0]?.avg;
    if (avgScore) {
      await db.update(techniciansTable).set({ rating: parseFloat(avgScore) }).where(eq(techniciansTable.id, technicianId));
    }
    res.status(201).json(rating);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/ratings/technician/:technicianId", async (req, res) => {
  try {
    const technicianId = parseInt(req.params["technicianId"] as string);
    const ratings = await db.select().from(ratingsTable).where(eq(ratingsTable.technicianId, technicianId));
    res.json(ratings);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
