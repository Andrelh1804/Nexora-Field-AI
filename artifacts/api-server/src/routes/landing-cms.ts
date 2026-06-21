import { Router, type Response } from "express";
import { db, landingSettingsTable, landingTestimonialsTable, landingFaqTable, landingBenefitsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

const ADMIN_ROLES = ["admin", "admin_master"];

const DEFAULT_SETTINGS: Record<string, string> = {
  "hero.title": "Intelligent Field Services",
  "hero.subtitle": "Conectamos empresas que precisam de suporte técnico em campo com técnicos autônomos especializados através de IA.",
  "hero.cta_primary": "Começar Agora",
  "hero.cta_secondary": "Acessar Conta",
  "footer.email": "contato@nexorafield.com.br",
  "footer.phone": "(11) 3000-0000",
  "footer.instagram": "https://instagram.com/nexorafield",
  "footer.linkedin": "https://linkedin.com/company/nexorafield",
};

router.get("/landing/settings", async (_req, res) => {
  try {
    const rows = await db.select().from(landingSettingsTable);
    const settings: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const row of rows) settings[row.key] = row.value;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Erro interno." });
  }
});

router.put("/landing/settings", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      const [existing] = await db.select({ id: landingSettingsTable.id }).from(landingSettingsTable).where(eq(landingSettingsTable.key, key)).limit(1);
      if (existing) {
        await db.update(landingSettingsTable).set({ value }).where(eq(landingSettingsTable.key, key));
      } else {
        await db.insert(landingSettingsTable).values({ key, value });
      }
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.get("/landing/testimonials", async (_req, res) => {
  try {
    const rows = await db.select().from(landingTestimonialsTable).where(eq(landingTestimonialsTable.active, true)).orderBy(asc(landingTestimonialsTable.sortOrder));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro interno." });
  }
});

router.get("/landing/testimonials/all", requireAuth, requireRole("admin", "admin_master"), async (_req, res) => {
  try {
    const rows = await db.select().from(landingTestimonialsTable).orderBy(asc(landingTestimonialsTable.sortOrder));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/landing/testimonials", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, company, content, avatar, sortOrder } = req.body;
    if (!name || !role || !content) { res.status(400).json({ error: "name, role, content são obrigatórios." }); return; }
    const [row] = await db.insert(landingTestimonialsTable).values({ name, role, company, content, avatar, sortOrder: sortOrder || 0 }).returning();
    res.status(201).json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.patch("/landing/testimonials/:id", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [row] = await db.update(landingTestimonialsTable).set(req.body).where(eq(landingTestimonialsTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Não encontrado." }); return; }
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.delete("/landing/testimonials/:id", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    await db.delete(landingTestimonialsTable).where(eq(landingTestimonialsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.get("/landing/faq", async (_req, res) => {
  try {
    const rows = await db.select().from(landingFaqTable).where(eq(landingFaqTable.active, true)).orderBy(asc(landingFaqTable.sortOrder));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro interno." });
  }
});

router.get("/landing/faq/all", requireAuth, requireRole("admin", "admin_master"), async (_req, res) => {
  try {
    const rows = await db.select().from(landingFaqTable).orderBy(asc(landingFaqTable.sortOrder));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/landing/faq", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const { question, answer, sortOrder } = req.body;
    if (!question || !answer) { res.status(400).json({ error: "question e answer são obrigatórios." }); return; }
    const [row] = await db.insert(landingFaqTable).values({ question, answer, sortOrder: sortOrder || 0 }).returning();
    res.status(201).json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.patch("/landing/faq/:id", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [row] = await db.update(landingFaqTable).set(req.body).where(eq(landingFaqTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Não encontrado." }); return; }
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.delete("/landing/faq/:id", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    await db.delete(landingFaqTable).where(eq(landingFaqTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.get("/landing/benefits", async (_req, res) => {
  try {
    const rows = await db.select().from(landingBenefitsTable).where(eq(landingBenefitsTable.active, true)).orderBy(asc(landingBenefitsTable.sortOrder));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro interno." });
  }
});

router.get("/landing/benefits/all", requireAuth, requireRole("admin", "admin_master"), async (_req, res) => {
  try {
    const rows = await db.select().from(landingBenefitsTable).orderBy(asc(landingBenefitsTable.sortOrder));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/landing/benefits", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const { icon, title, description, sortOrder } = req.body;
    if (!title || !description) { res.status(400).json({ error: "title e description são obrigatórios." }); return; }
    const [row] = await db.insert(landingBenefitsTable).values({ icon: icon || "✅", title, description, sortOrder: sortOrder || 0 }).returning();
    res.status(201).json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.patch("/landing/benefits/:id", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [row] = await db.update(landingBenefitsTable).set(req.body).where(eq(landingBenefitsTable.id, id)).returning();
    if (!row) { res.status(404).json({ error: "Não encontrado." }); return; }
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.delete("/landing/benefits/:id", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    await db.delete(landingBenefitsTable).where(eq(landingBenefitsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

export default router;
