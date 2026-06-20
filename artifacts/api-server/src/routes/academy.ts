import { Router, type Response } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { db } from "@workspace/db";
import { academyCoursesTable, academyEnrollmentsTable, academyCertificatesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

router.get("/academy/courses", async (req, res) => {
  const { specialty, level } = req.query as Record<string, string>;
  let query = db.select().from(academyCoursesTable).where(eq(academyCoursesTable.published, true)).$dynamic();
  if (specialty) query = query.where(eq(academyCoursesTable.specialty, specialty));
  if (level) query = query.where(eq(academyCoursesTable.level, level as any));
  const courses = await query.orderBy(desc(academyCoursesTable.enrollments));
  res.json(courses);
});

router.get("/academy/courses/:id", async (req, res) => {
  const [course] = await db.select().from(academyCoursesTable).where(eq(academyCoursesTable.id, Number(req.params["id"])));
  if (!course) { res.status(404).json({ error: "Not found" }); return; }
  res.json(course);
});

router.post("/academy/courses", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const [course] = await db.insert(academyCoursesTable).values(req.body).returning();
  res.json(course);
});

router.post("/academy/courses/:id/enroll", requireAuth, async (req: AuthRequest, res: Response) => {
  const courseId = Number(req.params["id"]);
  const existing = await db.select().from(academyEnrollmentsTable).where(and(eq(academyEnrollmentsTable.courseId, courseId), eq(academyEnrollmentsTable.userId, req.userId!)));
  if (existing.length > 0) { res.json(existing[0]); return; }
  const [enrollment] = await db.insert(academyEnrollmentsTable).values({ courseId, userId: req.userId!, progress: 0 }).returning();
  await db.update(academyCoursesTable).set({ enrollments: (await db.select().from(academyCoursesTable).where(eq(academyCoursesTable.id, courseId)))[0]!.enrollments + 1 }).where(eq(academyCoursesTable.id, courseId));
  res.json(enrollment);
});

router.post("/academy/courses/:id/complete", requireAuth, async (req: AuthRequest, res: Response) => {
  const courseId = Number(req.params["id"]);
  await db.update(academyEnrollmentsTable).set({ progress: 100, completedAt: new Date() }).where(and(eq(academyEnrollmentsTable.courseId, courseId), eq(academyEnrollmentsTable.userId, req.userId!)));
  const hash = crypto.createHash("sha256").update(`${courseId}-${req.userId!}-${Date.now()}`).digest("hex");
  const existing = await db.select().from(academyCertificatesTable).where(and(eq(academyCertificatesTable.courseId, courseId), eq(academyCertificatesTable.userId, req.userId!)));
  if (existing.length === 0) {
    const [cert] = await db.insert(academyCertificatesTable).values({ courseId, userId: req.userId!, hash }).returning();
    res.json(cert); return;
  }
  res.json(existing[0]);
});

router.get("/academy/my-courses", requireAuth, async (req: AuthRequest, res: Response) => {
  const enrollments = await db.select({ enrollment: academyEnrollmentsTable, course: academyCoursesTable })
    .from(academyEnrollmentsTable)
    .leftJoin(academyCoursesTable, eq(academyEnrollmentsTable.courseId, academyCoursesTable.id))
    .where(eq(academyEnrollmentsTable.userId, req.userId!))
    .orderBy(desc(academyEnrollmentsTable.createdAt));
  res.json(enrollments);
});

router.get("/academy/certificates", requireAuth, async (req: AuthRequest, res: Response) => {
  const certs = await db.select({ cert: academyCertificatesTable, course: academyCoursesTable })
    .from(academyCertificatesTable)
    .leftJoin(academyCoursesTable, eq(academyCertificatesTable.courseId, academyCoursesTable.id))
    .where(eq(academyCertificatesTable.userId, req.userId!))
    .orderBy(desc(academyCertificatesTable.issuedAt));
  res.json(certs);
});

export default router;
