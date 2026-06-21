import { Router, type Response } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { db } from "@workspace/db";
import {
  academyCoursesTable,
  academyEnrollmentsTable,
  academyCertificatesTable,
  technicianRankingsTable,
  techniciansTable,
} from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// ── Public: list all published courses ─────────────────────────────
router.get("/academy/courses", async (req, res) => {
  const { specialty, level, category } = req.query as Record<string, string>;
  let query = db.select().from(academyCoursesTable).where(eq(academyCoursesTable.published, true)).$dynamic();
  if (specialty) query = query.where(eq(academyCoursesTable.specialty, specialty));
  if (level) query = query.where(eq(academyCoursesTable.level, level as any));
  if (category) query = query.where(eq(academyCoursesTable.category, category));
  const courses = await query.orderBy(desc(academyCoursesTable.enrollments));
  res.json(courses);
});

// ── Public: list categories ─────────────────────────────────────────
router.get("/academy/categories", async (_req, res) => {
  const result = await db.execute(sql`
    SELECT category, count(*) as total, 
           sum(CASE WHEN is_mandatory THEN 1 ELSE 0 END) as mandatory_count
    FROM academy_courses
    WHERE published = true
    GROUP BY category
    ORDER BY MIN(id)
  `);
  res.json(result.rows);
});

// ── Get single course ───────────────────────────────────────────────
router.get("/academy/courses/:id", async (req, res) => {
  const [course] = await db.select().from(academyCoursesTable).where(eq(academyCoursesTable.id, Number(req.params["id"])));
  if (!course) { res.status(404).json({ error: "Not found" }); return; }
  res.json(course);
});

// ── Admin: create course ────────────────────────────────────────────
router.post("/academy/courses", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const [course] = await db.insert(academyCoursesTable).values(req.body).returning();
  res.json(course);
});

// ── Enroll in course ────────────────────────────────────────────────
router.post("/academy/courses/:id/enroll", requireAuth, async (req: AuthRequest, res: Response) => {
  const courseId = Number(req.params["id"]);
  const existing = await db.select().from(academyEnrollmentsTable)
    .where(and(eq(academyEnrollmentsTable.courseId, courseId), eq(academyEnrollmentsTable.userId, req.userId!)));
  if (existing.length > 0) { res.json(existing[0]); return; }
  const [enrollment] = await db.insert(academyEnrollmentsTable)
    .values({ courseId, userId: req.userId!, progress: 0 })
    .returning();
  await db.update(academyCoursesTable)
    .set({ enrollments: sql`${academyCoursesTable.enrollments} + 1` })
    .where(eq(academyCoursesTable.id, courseId));
  res.json(enrollment);
});

// ── Complete course + issue certificate + update academy_score ──────
router.post("/academy/courses/:id/complete", requireAuth, async (req: AuthRequest, res: Response) => {
  const courseId = Number(req.params["id"]);

  // Mark enrollment as complete
  await db.update(academyEnrollmentsTable)
    .set({ progress: 100, completedAt: new Date() })
    .where(and(eq(academyEnrollmentsTable.courseId, courseId), eq(academyEnrollmentsTable.userId, req.userId!)));

  // Issue certificate if not already issued
  const existing = await db.select().from(academyCertificatesTable)
    .where(and(eq(academyCertificatesTable.courseId, courseId), eq(academyCertificatesTable.userId, req.userId!)));

  let cert = existing[0];
  if (!cert) {
    const hash = crypto.createHash("sha256").update(`${courseId}-${req.userId!}-${Date.now()}`).digest("hex");
    const [created] = await db.insert(academyCertificatesTable)
      .values({ courseId, userId: req.userId!, hash })
      .returning();
    cert = created!;
  }

  // Update academy_score in technician_rankings (if technician)
  try {
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    if (tech) {
      // Sum all completed course points for this technician
      const scoreResult = await db.execute(sql`
        SELECT COALESCE(SUM(ac.points_value), 0) as total
        FROM academy_enrollments ae
        JOIN academy_courses ac ON ac.id = ae.course_id
        WHERE ae.user_id = ${req.userId!} AND ae.completed_at IS NOT NULL
      `);
      const academyScore = Number((scoreResult.rows[0] as any)?.total ?? 0);

      // Check if ranking exists
      const [ranking] = await db.select().from(technicianRankingsTable)
        .where(eq(technicianRankingsTable.technicianId, tech.id)).limit(1);

      if (ranking) {
        // Recompute total score = field score (80%) + academy score (20% mapped)
        const fieldScore = (tech.totalServices * 10) + ((tech.rating || 0) * 50);
        const totalScore = fieldScore + academyScore;
        const level = computeLevel(totalScore);
        await db.update(technicianRankingsTable)
          .set({ academyScore, score: totalScore, level })
          .where(eq(technicianRankingsTable.technicianId, tech.id));
      } else {
        const fieldScore = (tech.totalServices * 10) + ((tech.rating || 0) * 50);
        const totalScore = fieldScore + academyScore;
        const level = computeLevel(totalScore);
        await db.insert(technicianRankingsTable)
          .values({ technicianId: tech.id, academyScore, score: totalScore, level, completedOrders: tech.totalServices, avgRating: tech.rating || 0 });
      }
    }
  } catch (_e) {
    // Non-blocking: log but don't fail the response
  }

  res.json(cert);
});

// ── My courses ──────────────────────────────────────────────────────
router.get("/academy/my-courses", requireAuth, async (req: AuthRequest, res: Response) => {
  const enrollments = await db.select({ enrollment: academyEnrollmentsTable, course: academyCoursesTable })
    .from(academyEnrollmentsTable)
    .leftJoin(academyCoursesTable, eq(academyEnrollmentsTable.courseId, academyCoursesTable.id))
    .where(eq(academyEnrollmentsTable.userId, req.userId!))
    .orderBy(desc(academyEnrollmentsTable.createdAt));
  res.json(enrollments);
});

// ── Certificates ────────────────────────────────────────────────────
router.get("/academy/certificates", requireAuth, async (req: AuthRequest, res: Response) => {
  const certs = await db.select({ cert: academyCertificatesTable, course: academyCoursesTable })
    .from(academyCertificatesTable)
    .leftJoin(academyCoursesTable, eq(academyCertificatesTable.courseId, academyCoursesTable.id))
    .where(eq(academyCertificatesTable.userId, req.userId!))
    .orderBy(desc(academyCertificatesTable.issuedAt));
  res.json(certs);
});

// ── My academy score ────────────────────────────────────────────────
router.get("/academy/my-score", requireAuth, async (req: AuthRequest, res: Response) => {
  const scoreResult = await db.execute(sql`
    SELECT 
      COALESCE(SUM(ac.points_value), 0) as total_score,
      COUNT(ae.id) as total_completed,
      COALESCE(SUM(CASE WHEN ac.is_mandatory THEN ac.points_value ELSE 0 END), 0) as mandatory_score,
      COALESCE(SUM(CASE WHEN NOT ac.is_mandatory THEN ac.points_value ELSE 0 END), 0) as optional_score,
      COUNT(CASE WHEN ac.is_mandatory AND ae.completed_at IS NOT NULL THEN 1 END) as mandatory_completed
    FROM academy_enrollments ae
    JOIN academy_courses ac ON ac.id = ae.course_id
    WHERE ae.user_id = ${req.userId!} AND ae.completed_at IS NOT NULL
  `);
  const row = (scoreResult.rows[0] as any) ?? {};
  res.json({
    totalScore: Number(row.total_score ?? 0),
    totalCompleted: Number(row.total_completed ?? 0),
    mandatoryScore: Number(row.mandatory_score ?? 0),
    optionalScore: Number(row.optional_score ?? 0),
    mandatoryCompleted: Number(row.mandatory_completed ?? 0),
    isHomologado: Number(row.mandatory_completed ?? 0) > 0,
  });
});

function computeLevel(score: number): "bronze" | "prata" | "ouro" | "platina" | "diamante" {
  if (score >= 5000) return "diamante";
  if (score >= 2000) return "platina";
  if (score >= 800) return "ouro";
  if (score >= 250) return "prata";
  return "bronze";
}

export default router;
