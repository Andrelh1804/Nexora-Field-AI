import { Router, type Response } from "express";
import { db, techniciansTable, ratingsTable } from "@workspace/db";
import { eq, avg, ilike, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { sql } from "drizzle-orm";
import { haversineKm } from "../lib/haversine";

const router = Router();

router.get("/technicians", async (req, res) => {
  try {
    const { specialty, city, state, lat, lon, radius } = req.query as Record<string, string>;

    let query = db.select().from(techniciansTable);
    const conditions = [];

    if (lat && lon) {
      const originLat = parseFloat(lat);
      const originLon = parseFloat(lon);
      const maxRadius = radius ? parseFloat(radius) : 100;

      if (!isNaN(originLat) && !isNaN(originLon)) {
        const allTechs = await db.select().from(techniciansTable);
        const filtered = allTechs.filter(t => {
          if (t.latitude != null && t.longitude != null) {
            const dist = haversineKm(originLat, originLon, t.latitude, t.longitude);
            const techRadius = t.serviceRadius ?? 100;
            return dist <= Math.max(maxRadius, techRadius);
          }
          if (state) return (t.state ?? "").toLowerCase() === state.toLowerCase();
          return true;
        });
        if (specialty) {
          const filtered2 = filtered.filter(t =>
            t.specialties.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
          );
          res.json(filtered2);
        } else {
          res.json(filtered);
        }
        return;
      }
    }

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
    if (!tech) { res.status(404).json({ error: "Profile not found" }); return; }
    res.json(tech);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/technicians/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, email, phone, whatsapp, cpf, city, state, photoUrl, bio, specialties,
      latitude, longitude, serviceRadius, availableDays, availableFrom, availableTo, isAvailable,
    } = req.body;

    const updateData: Record<string, unknown> = {
      name, email, phone, whatsapp, cpf, city, state, photoUrl, bio, specialties,
    };
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (serviceRadius !== undefined) updateData.serviceRadius = serviceRadius;
    if (availableDays !== undefined) updateData.availableDays = availableDays;
    if (availableFrom !== undefined) updateData.availableFrom = availableFrom;
    if (availableTo !== undefined) updateData.availableTo = availableTo;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    const [existing] = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    let tech;
    if (existing) {
      [tech] = await db.update(techniciansTable).set(updateData).where(eq(techniciansTable.userId, req.userId!)).returning();
    } else {
      [tech] = await db.insert(techniciansTable)
        .values({
          userId: req.userId!,
          name: name || "Técnico",
          email: email || "",
          phone, whatsapp, cpf,
          city: city || "N/A", state: state || "N/A",
          photoUrl, bio,
          specialties: specialties || [],
          latitude, longitude,
          serviceRadius: serviceRadius ?? 100,
          availableDays: availableDays || [],
          availableFrom, availableTo,
          isAvailable: isAvailable ?? true,
        })
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
    if (!tech) { res.status(404).json({ error: "Technician not found" }); return; }
    res.json(tech);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
