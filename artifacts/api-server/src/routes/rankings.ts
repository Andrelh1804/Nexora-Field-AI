import { Router, type Response } from "express";
import { db, technicianRankingsTable, techniciansTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

function computeLevel(score: number): "bronze" | "prata" | "ouro" | "platina" | "diamante" {
  if (score >= 5000) return "diamante";
  if (score >= 2000) return "platina";
  if (score >= 800) return "ouro";
  if (score >= 250) return "prata";
  return "bronze";
}

const LEVEL_CONFIG = {
  bronze:   { label: "Bronze",   color: "#CD7F32", min: 0,    next: 250 },
  prata:    { label: "Prata",    color: "#C0C0C0", min: 250,  next: 800 },
  ouro:     { label: "Ouro",     color: "#FFD700", min: 800,  next: 2000 },
  platina:  { label: "Platina",  color: "#E5E4E2", min: 2000, next: 5000 },
  diamante: { label: "Diamante", color: "#00BFFF", min: 5000, next: null },
};

// Global ranking leaderboard
router.get("/rankings", async (_req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT tr.*, t.name, t.photo_url, t.city, t.state, t.specialties, t.total_services
      FROM technician_rankings tr
      JOIN technicians t ON t.id = tr.technician_id
      ORDER BY tr.score DESC
      LIMIT 100
    `);
    const rows = result.rows.map((r: any, i: number) => ({
      ...r,
      position: i + 1,
      levelConfig: LEVEL_CONFIG[r.level as keyof typeof LEVEL_CONFIG],
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// My ranking
router.get("/rankings/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    if (!tech) {
      res.status(404).json({ error: "Technician profile not found" });
      return;
    }
    const [ranking] = await db.select().from(technicianRankingsTable)
      .where(eq(technicianRankingsTable.technicianId, tech.id)).limit(1);
    if (!ranking) {
      const [created] = await db.insert(technicianRankingsTable).values({
        technicianId: tech.id,
        level: "bronze",
        score: 0,
        completedOrders: tech.totalServices,
        avgRating: tech.rating || 0,
        academyScore: 0,
      }).returning();
      res.json({ ...created, levelConfig: LEVEL_CONFIG.bronze });
      return;
    }
    const posResult = await db.execute(sql`
      SELECT COUNT(*) + 1 as position FROM technician_rankings WHERE score > ${ranking.score}
    `);
    const posRow = posResult.rows[0] as any;
    res.json({ ...ranking, position: Number(posRow?.position || 1), levelConfig: LEVEL_CONFIG[ranking.level] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Recalculate ranking for a technician (includes academy_score)
router.post("/rankings/recalculate/:technicianId", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const techId = parseInt(req.params["technicianId"] as string);
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.id, techId)).limit(1);
    if (!tech) { res.status(404).json({ error: "Not found" }); return; }

    // Get academy score for this technician
    const academyResult = await db.execute(sql`
      SELECT COALESCE(SUM(ac.points_value), 0) as total
      FROM academy_enrollments ae
      JOIN academy_courses ac ON ac.id = ae.course_id
      JOIN users u ON u.id = ae.user_id
      JOIN technicians t ON t.user_id = u.id
      WHERE t.id = ${techId} AND ae.completed_at IS NOT NULL
    `);
    const academyScore = Number((academyResult.rows[0] as any)?.total ?? 0);

    // Score = field performance (80% weight base) + academy bonus
    const fieldScore = (tech.totalServices * 10) + ((tech.rating || 0) * 50);
    const score = fieldScore + academyScore;
    const level = computeLevel(score);

    const existing = await db.select().from(technicianRankingsTable)
      .where(eq(technicianRankingsTable.technicianId, techId)).limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(technicianRankingsTable)
        .set({ score, level, completedOrders: tech.totalServices, avgRating: tech.rating || 0, academyScore })
        .where(eq(technicianRankingsTable.technicianId, techId))
        .returning();
      res.json(updated);
    } else {
      const [created] = await db.insert(technicianRankingsTable)
        .values({ technicianId: techId, score, level, completedOrders: tech.totalServices, avgRating: tech.rating || 0, academyScore })
        .returning();
      res.json(created);
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
