import { Router, type Response } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { db } from "@workspace/db";
import {
  academyCoursesTable,
  academyEnrollmentsTable,
  academyCertificatesTable,
  academyModulesTable,
  academyLessonsTable,
  academyQuizQuestionsTable,
  academyCategoriesTable,
  academyCertificateTemplatesTable,
  usersTable,
} from "@workspace/db";
import { eq, desc, asc, sql, and } from "drizzle-orm";

const router = Router();
const adminMiddleware = [requireAuth, requireRole("admin", "admin_master")];

// ── DASHBOARD STATS ──────────────────────────────────────────────────
router.get("/admin/academy/stats", ...adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalCoursesRes,
      totalStudentsRes,
      totalCertsRes,
      topCoursesRes,
      certsByMonthRes,
      coursesByCategoryRes,
    ] = await Promise.all([
      db.execute(sql`SELECT count(*) as total FROM academy_courses`),
      db.execute(sql`SELECT count(DISTINCT user_id) as total FROM academy_enrollments`),
      db.execute(sql`SELECT count(*) as total FROM academy_certificates`),
      db.execute(sql`
        SELECT ac.id, ac.title, ac.category, ac.enrollments, ac.rating, ac.is_mandatory, ac.level,
               COUNT(ae.id) FILTER (WHERE ae.completed_at IS NOT NULL) as completions
        FROM academy_courses ac
        LEFT JOIN academy_enrollments ae ON ae.course_id = ac.id
        GROUP BY ac.id
        ORDER BY ac.enrollments DESC LIMIT 10
      `),
      db.execute(sql`
        SELECT to_char(issued_at, 'YYYY-MM') as month, count(*) as total
        FROM academy_certificates
        GROUP BY month ORDER BY month DESC LIMIT 12
      `),
      db.execute(sql`
        SELECT category, count(*) as total FROM academy_courses WHERE published = true GROUP BY category ORDER BY total DESC
      `),
    ]);

    res.json({
      totalCourses: Number((totalCoursesRes.rows[0] as any)?.total ?? 0),
      totalStudents: Number((totalStudentsRes.rows[0] as any)?.total ?? 0),
      totalCertificates: Number((totalCertsRes.rows[0] as any)?.total ?? 0),
      topCourses: topCoursesRes.rows,
      certsByMonth: certsByMonthRes.rows,
      coursesByCategory: coursesByCategoryRes.rows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro interno." });
  }
});

// ── CATEGORIES CRUD ──────────────────────────────────────────────────
router.get("/admin/academy/categories", ...adminMiddleware, async (_req: AuthRequest, res: Response) => {
  const cats = await db.select().from(academyCategoriesTable).orderBy(asc(academyCategoriesTable.order));
  res.json(cats);
});

router.post("/admin/academy/categories", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [cat] = await db.insert(academyCategoriesTable).values(req.body).returning();
    res.json(cat);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/admin/academy/categories/:id", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params["id"]);
  const { id: _id, createdAt: _ca, ...data } = req.body;
  const [cat] = await db.update(academyCategoriesTable).set(data).where(eq(academyCategoriesTable.id, id)).returning();
  if (!cat) { res.status(404).json({ error: "Not found" }); return; }
  res.json(cat);
});

router.delete("/admin/academy/categories/:id", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  await db.delete(academyCategoriesTable).where(eq(academyCategoriesTable.id, Number(req.params["id"])));
  res.json({ success: true });
});

// ── MODULES CRUD ─────────────────────────────────────────────────────
router.get("/admin/academy/modules", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  const courseId = req.query["courseId"] ? Number(req.query["courseId"]) : undefined;
  let q = db.select().from(academyModulesTable).$dynamic();
  if (courseId) q = q.where(eq(academyModulesTable.courseId, courseId));
  const modules = await q.orderBy(asc(academyModulesTable.order), asc(academyModulesTable.id));
  res.json(modules);
});

router.post("/admin/academy/modules", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [mod] = await db.insert(academyModulesTable).values(req.body).returning();
    res.json(mod);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/admin/academy/modules/:id", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params["id"]);
  const { id: _id, createdAt: _ca, ...data } = req.body;
  const [mod] = await db.update(academyModulesTable).set(data).where(eq(academyModulesTable.id, id)).returning();
  if (!mod) { res.status(404).json({ error: "Not found" }); return; }
  res.json(mod);
});

router.delete("/admin/academy/modules/:id", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  await db.delete(academyModulesTable).where(eq(academyModulesTable.id, Number(req.params["id"])));
  res.json({ success: true });
});

// ── LESSONS CRUD ─────────────────────────────────────────────────────
router.get("/admin/academy/lessons", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  const moduleId = req.query["moduleId"] ? Number(req.query["moduleId"]) : undefined;
  const courseId = req.query["courseId"] ? Number(req.query["courseId"]) : undefined;
  let q = db.select().from(academyLessonsTable).$dynamic();
  if (moduleId) q = q.where(eq(academyLessonsTable.moduleId, moduleId));
  else if (courseId) q = q.where(eq(academyLessonsTable.courseId, courseId));
  const lessons = await q.orderBy(asc(academyLessonsTable.order), asc(academyLessonsTable.id));
  res.json(lessons);
});

router.post("/admin/academy/lessons", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [lesson] = await db.insert(academyLessonsTable).values(req.body).returning();
    res.json(lesson);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/admin/academy/lessons/:id", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params["id"]);
  const { id: _id, createdAt: _ca, ...data } = req.body;
  const [lesson] = await db.update(academyLessonsTable).set(data).where(eq(academyLessonsTable.id, id)).returning();
  if (!lesson) { res.status(404).json({ error: "Not found" }); return; }
  res.json(lesson);
});

router.delete("/admin/academy/lessons/:id", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  await db.delete(academyLessonsTable).where(eq(academyLessonsTable.id, Number(req.params["id"])));
  res.json({ success: true });
});

// ── QUIZ QUESTIONS CRUD ──────────────────────────────────────────────
router.get("/admin/academy/questions", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  const lessonId = req.query["lessonId"] ? Number(req.query["lessonId"]) : undefined;
  let q = db.select().from(academyQuizQuestionsTable).$dynamic();
  if (lessonId) q = q.where(eq(academyQuizQuestionsTable.lessonId, lessonId));
  const questions = await q.orderBy(asc(academyQuizQuestionsTable.order));
  res.json(questions);
});

router.post("/admin/academy/questions", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [q] = await db.insert(academyQuizQuestionsTable).values(req.body).returning();
    res.json(q);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/admin/academy/questions/:id", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params["id"]);
  const { id: _id, ...data } = req.body;
  const [q] = await db.update(academyQuizQuestionsTable).set(data).where(eq(academyQuizQuestionsTable.id, id)).returning();
  if (!q) { res.status(404).json({ error: "Not found" }); return; }
  res.json(q);
});

router.delete("/admin/academy/questions/:id", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  await db.delete(academyQuizQuestionsTable).where(eq(academyQuizQuestionsTable.id, Number(req.params["id"])));
  res.json({ success: true });
});

// ── ADMIN: ALL STUDENTS ───────────────────────────────────────────────
router.get("/admin/academy/students", ...adminMiddleware, async (_req: AuthRequest, res: Response) => {
  const rows = await db.execute(sql`
    SELECT
      u.id as user_id, u.name, u.email,
      COUNT(ae.id) as total_enrolled,
      COUNT(ae.id) FILTER (WHERE ae.completed_at IS NOT NULL) as total_completed,
      COUNT(cert.id) as total_certs,
      MAX(ae.created_at) as last_activity
    FROM users u
    JOIN academy_enrollments ae ON ae.user_id = u.id
    LEFT JOIN academy_certificates cert ON cert.user_id = u.id
    GROUP BY u.id, u.name, u.email
    ORDER BY total_enrolled DESC
  `);
  res.json(rows.rows);
});

router.get("/admin/academy/students/:userId", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = Number(req.params["userId"]);
  const enrollments = await db.execute(sql`
    SELECT ae.*, ac.title, ac.category, ac.level, ac.points_value, ac.is_mandatory
    FROM academy_enrollments ae
    JOIN academy_courses ac ON ac.id = ae.course_id
    WHERE ae.user_id = ${userId}
    ORDER BY ae.created_at DESC
  `);
  const certs = await db.execute(sql`
    SELECT cert.*, ac.title FROM academy_certificates cert
    JOIN academy_courses ac ON ac.id = cert.course_id
    WHERE cert.user_id = ${userId}
    ORDER BY cert.issued_at DESC
  `);
  res.json({ enrollments: enrollments.rows, certificates: certs.rows });
});

router.delete("/admin/academy/students/:userId/enrollment/:courseId", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = Number(req.params["userId"]);
  const courseId = Number(req.params["courseId"]);
  await db.delete(academyEnrollmentsTable).where(and(eq(academyEnrollmentsTable.userId, userId), eq(academyEnrollmentsTable.courseId, courseId)));
  res.json({ success: true });
});

// ── ADMIN: ALL CERTIFICATES ───────────────────────────────────────────
router.get("/admin/academy/all-certificates", ...adminMiddleware, async (_req: AuthRequest, res: Response) => {
  const rows = await db.execute(sql`
    SELECT cert.id, cert.hash, cert.issued_at, ac.title as course_title, ac.level, u.name as user_name, u.email
    FROM academy_certificates cert
    JOIN academy_courses ac ON ac.id = cert.course_id
    JOIN users u ON u.id = cert.user_id
    ORDER BY cert.issued_at DESC
    LIMIT 200
  `);
  res.json(rows.rows);
});

// ── CERTIFICATE TEMPLATES CRUD ────────────────────────────────────────
router.get("/admin/academy/cert-templates", ...adminMiddleware, async (_req: AuthRequest, res: Response) => {
  const templates = await db.select().from(academyCertificateTemplatesTable).orderBy(desc(academyCertificateTemplatesTable.id));
  res.json(templates);
});

router.post("/admin/academy/cert-templates", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [t] = await db.insert(academyCertificateTemplatesTable).values(req.body).returning();
    res.json(t);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/admin/academy/cert-templates/:id", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params["id"]);
  const { id: _id, createdAt: _ca, ...data } = req.body;
  const [t] = await db.update(academyCertificateTemplatesTable).set(data).where(eq(academyCertificateTemplatesTable.id, id)).returning();
  res.json(t);
});

router.delete("/admin/academy/cert-templates/:id", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  await db.delete(academyCertificateTemplatesTable).where(eq(academyCertificateTemplatesTable.id, Number(req.params["id"])));
  res.json({ success: true });
});

// ── DUPLICATE COURSE ─────────────────────────────────────────────────
router.post("/admin/academy/courses/:id/duplicate", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params["id"]);
  const [orig] = await db.select().from(academyCoursesTable).where(eq(academyCoursesTable.id, id));
  if (!orig) { res.status(404).json({ error: "Not found" }); return; }
  const { id: _id, createdAt: _ca, updatedAt: _ua, enrollments: _enr, ...data } = orig;
  const [copy] = await db.insert(academyCoursesTable).values({
    ...data,
    title: `${data.title} (Cópia)`,
    slug: data.slug ? `${data.slug}-copia` : undefined,
    published: false,
    status: "rascunho",
  }).returning();
  res.json(copy);
});

// ── ARCHIVE COURSE ───────────────────────────────────────────────────
router.put("/admin/academy/courses/:id/archive", ...adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params["id"]);
  const [course] = await db.update(academyCoursesTable)
    .set({ published: false, status: "arquivado" })
    .where(eq(academyCoursesTable.id, id))
    .returning();
  res.json(course);
});

export default router;
