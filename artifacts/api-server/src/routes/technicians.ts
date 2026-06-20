import { Router, type Response } from "express";
import { db, techniciansTable, ratingsTable } from "@workspace/db";
import { eq, avg, ilike, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/technicians", async (req, res) => {
  try {
    const { specialty, city, state } = req.query as Record<string, string>;
    let query = db.select().from(techniciansTable);
    const conditions = [];
    if (city) conditions.push(ilike(techniciansTable.city, `%${city}%`));
    if (state) conditions.push(ilike(techniciansTable.state, `%${state}%`));
    if (specialty) conditions.push(sql`${techniciansTable.specialties} @> ARRAY[${specialty}]::text[]`);
    const technicians = conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;
    res.json(technicians);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/technicians/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    if (!tech) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(tech);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/technicians/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, whatsapp, cpf, city, state, photoUrl, bio, specialties } = req.body;
    const [existing] = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    let tech;
    if (existing) {
      [tech] = await db.update(techniciansTable)
        .set({ name, email, phone, whatsapp, cpf, city, state, photoUrl, bio, specialties })
        .where(eq(techniciansTable.userId, req.userId!))
        .returning();
    } else {
      [tech] = await db.insert(techniciansTable)
        .values({ userId: req.userId!, name, email, phone, whatsapp, cpf, city: city || "N/A", state: state || "N/A", photoUrl, bio, specialties: specialties || [] })
        .returning();
    }
    res.json(tech);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/technicians/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, id)).limit(1);
    if (!tech) {
      res.status(404).json({ error: "Technician not found" });
      return;
    }
    res.json(tech);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
