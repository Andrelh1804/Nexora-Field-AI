import { Router, type Response } from "express";
import { db } from "@workspace/db";
import {
  specialtyCategoriesTable,
  specialtySubcategoriesTable,
  specialtySkillsTable,
  technicianSpecialtiesTable,
  techniciansTable,
} from "@workspace/db";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /specialties — full hierarchy (categories → subcategories → skills)
router.get("/specialties", async (_req, res) => {
  try {
    const categories = await db
      .select()
      .from(specialtyCategoriesTable)
      .where(eq(specialtyCategoriesTable.active, true))
      .orderBy(specialtyCategoriesTable.sortOrder, specialtyCategoriesTable.name);

    const subcategories = await db
      .select()
      .from(specialtySubcategoriesTable)
      .where(eq(specialtySubcategoriesTable.active, true))
      .orderBy(specialtySubcategoriesTable.sortOrder, specialtySubcategoriesTable.name);

    const skills = await db
      .select()
      .from(specialtySkillsTable)
      .where(eq(specialtySkillsTable.active, true))
      .orderBy(specialtySkillsTable.sortOrder, specialtySkillsTable.name);

    const tree = categories.map((cat) => ({
      ...cat,
      subcategories: subcategories
        .filter((sub) => sub.categoryId === cat.id)
        .map((sub) => ({
          ...sub,
          skills: skills.filter((sk) => sk.subcategoryId === sub.id),
        })),
    }));

    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar especialidades." });
  }
});

// GET /specialties/search?q= — fuzzy skill search
router.get("/specialties/search", async (req, res) => {
  try {
    const q = (req.query["q"] as string)?.trim() || "";
    if (!q) {
      const skills = await db
        .select({
          skillId: specialtySkillsTable.id,
          skillName: specialtySkillsTable.name,
          subcategoryId: specialtySubcategoriesTable.id,
          subcategoryName: specialtySubcategoriesTable.name,
          categoryId: specialtyCategoriesTable.id,
          categoryName: specialtyCategoriesTable.name,
          categoryIcon: specialtyCategoriesTable.icon,
        })
        .from(specialtySkillsTable)
        .leftJoin(specialtySubcategoriesTable, eq(specialtySkillsTable.subcategoryId, specialtySubcategoriesTable.id))
        .leftJoin(specialtyCategoriesTable, eq(specialtySubcategoriesTable.categoryId, specialtyCategoriesTable.id))
        .where(eq(specialtySkillsTable.active, true))
        .limit(50);
      res.json(skills);
      return;
    }
    const results = await db
      .select({
        skillId: specialtySkillsTable.id,
        skillName: specialtySkillsTable.name,
        subcategoryId: specialtySubcategoriesTable.id,
        subcategoryName: specialtySubcategoriesTable.name,
        categoryId: specialtyCategoriesTable.id,
        categoryName: specialtyCategoriesTable.name,
        categoryIcon: specialtyCategoriesTable.icon,
      })
      .from(specialtySkillsTable)
      .leftJoin(specialtySubcategoriesTable, eq(specialtySkillsTable.subcategoryId, specialtySubcategoriesTable.id))
      .leftJoin(specialtyCategoriesTable, eq(specialtySubcategoriesTable.categoryId, specialtyCategoriesTable.id))
      .where(
        and(
          eq(specialtySkillsTable.active, true),
          or(
            ilike(specialtySkillsTable.name, `%${q}%`),
            ilike(specialtySubcategoriesTable.name, `%${q}%`),
            ilike(specialtyCategoriesTable.name, `%${q}%`)
          )
        )
      )
      .limit(30);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Erro na busca." });
  }
});

// GET /technicians/me/specialties — my skills with levels
router.get("/technicians/me/specialties", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [tech] = await db
      .select()
      .from(techniciansTable)
      .where(eq(techniciansTable.userId, req.userId!))
      .limit(1);

    if (!tech) { res.json([]); return; }

    const specialties = await db
      .select({
        id: technicianSpecialtiesTable.id,
        technicianId: technicianSpecialtiesTable.technicianId,
        skillId: technicianSpecialtiesTable.skillId,
        level: technicianSpecialtiesTable.level,
        yearsExperience: technicianSpecialtiesTable.yearsExperience,
        skillName: specialtySkillsTable.name,
        subcategoryId: specialtySubcategoriesTable.id,
        subcategoryName: specialtySubcategoriesTable.name,
        categoryId: specialtyCategoriesTable.id,
        categoryName: specialtyCategoriesTable.name,
        categoryIcon: specialtyCategoriesTable.icon,
      })
      .from(technicianSpecialtiesTable)
      .leftJoin(specialtySkillsTable, eq(technicianSpecialtiesTable.skillId, specialtySkillsTable.id))
      .leftJoin(specialtySubcategoriesTable, eq(specialtySkillsTable.subcategoryId, specialtySubcategoriesTable.id))
      .leftJoin(specialtyCategoriesTable, eq(specialtySubcategoriesTable.categoryId, specialtyCategoriesTable.id))
      .where(eq(technicianSpecialtiesTable.technicianId, tech.id));

    res.json(specialties);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar especialidades do técnico." });
  }
});

// GET /technicians/:id/specialties — public profile skills
router.get("/technicians/:id/specialties", async (req, res) => {
  try {
    const techId = parseInt(req.params["id"] as string);
    if (isNaN(techId)) { res.status(400).json({ error: "ID inválido." }); return; }

    const specialties = await db
      .select({
        id: technicianSpecialtiesTable.id,
        skillId: technicianSpecialtiesTable.skillId,
        level: technicianSpecialtiesTable.level,
        yearsExperience: technicianSpecialtiesTable.yearsExperience,
        skillName: specialtySkillsTable.name,
        subcategoryName: specialtySubcategoriesTable.name,
        categoryName: specialtyCategoriesTable.name,
        categoryIcon: specialtyCategoriesTable.icon,
      })
      .from(technicianSpecialtiesTable)
      .leftJoin(specialtySkillsTable, eq(technicianSpecialtiesTable.skillId, specialtySkillsTable.id))
      .leftJoin(specialtySubcategoriesTable, eq(specialtySkillsTable.subcategoryId, specialtySubcategoriesTable.id))
      .leftJoin(specialtyCategoriesTable, eq(specialtySubcategoriesTable.categoryId, specialtyCategoriesTable.id))
      .where(eq(technicianSpecialtiesTable.technicianId, techId));

    res.json(specialties);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar especialidades." });
  }
});

// PUT /technicians/me/specialties — batch upsert skills
router.put("/technicians/me/specialties", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [tech] = await db
      .select()
      .from(techniciansTable)
      .where(eq(techniciansTable.userId, req.userId!))
      .limit(1);

    if (!tech) { res.status(404).json({ error: "Perfil de técnico não encontrado." }); return; }

    const { specialties } = req.body as {
      specialties: { skillId: number; level: string; yearsExperience: number }[];
    };

    if (!Array.isArray(specialties)) {
      res.status(400).json({ error: "specialties deve ser um array." });
      return;
    }

    // Delete all existing, then insert fresh (simplest pattern for batch replace)
    await db.delete(technicianSpecialtiesTable).where(eq(technicianSpecialtiesTable.technicianId, tech.id));

    if (specialties.length > 0) {
      await db.insert(technicianSpecialtiesTable).values(
        specialties.map((s) => ({
          technicianId: tech.id,
          skillId: s.skillId,
          level: s.level as "iniciante" | "intermediario" | "avancado" | "especialista",
          yearsExperience: s.yearsExperience ?? 0,
        }))
      );
    }

    // Also update legacy specialties[] array for backwards compat with existing code
    const skillNames = await db
      .select({ name: specialtySkillsTable.name })
      .from(technicianSpecialtiesTable)
      .leftJoin(specialtySkillsTable, eq(technicianSpecialtiesTable.skillId, specialtySkillsTable.id))
      .where(eq(technicianSpecialtiesTable.technicianId, tech.id));

    await db
      .update(techniciansTable)
      .set({ specialties: skillNames.map((s) => s.name ?? "") })
      .where(eq(techniciansTable.id, tech.id));

    res.json({ ok: true, count: specialties.length });
  } catch (err) {
    res.status(500).json({ error: "Erro ao salvar especialidades." });
  }
});

// =================== ADMIN ROUTES ===================

// GET /admin/specialties/categories
router.get("/admin/specialties/categories", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
    const cats = await db.select().from(specialtyCategoriesTable).orderBy(specialtyCategoriesTable.sortOrder);
    res.json(cats);
  } catch { res.status(500).json({ error: "Erro." }); }
});

// POST /admin/specialties/categories
router.post("/admin/specialties/categories", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
    const { name, icon, description, sortOrder } = req.body;
    if (!name) { res.status(400).json({ error: "name obrigatório." }); return; }
    const [cat] = await db.insert(specialtyCategoriesTable)
      .values({ name, icon: icon || "🔧", description, sortOrder: sortOrder ?? 0 })
      .returning();
    res.status(201).json(cat);
  } catch { res.status(500).json({ error: "Erro ao criar categoria." }); }
});

// POST /admin/specialties/subcategories
router.post("/admin/specialties/subcategories", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
    const { categoryId, name, description, sortOrder } = req.body;
    if (!categoryId || !name) { res.status(400).json({ error: "categoryId e name obrigatórios." }); return; }
    const [sub] = await db.insert(specialtySubcategoriesTable)
      .values({ categoryId, name, description, sortOrder: sortOrder ?? 0 })
      .returning();
    res.status(201).json(sub);
  } catch { res.status(500).json({ error: "Erro ao criar subcategoria." }); }
});

// POST /admin/specialties/skills
router.post("/admin/specialties/skills", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
    const { subcategoryId, name, sortOrder } = req.body;
    if (!subcategoryId || !name) { res.status(400).json({ error: "subcategoryId e name obrigatórios." }); return; }
    const [skill] = await db.insert(specialtySkillsTable)
      .values({ subcategoryId, name, sortOrder: sortOrder ?? 0 })
      .returning();
    res.status(201).json(skill);
  } catch { res.status(500).json({ error: "Erro ao criar skill." }); }
});

// PATCH /admin/specialties/skills/:id — toggle active
router.patch("/admin/specialties/skills/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
    const id = parseInt(req.params["id"] as string);
    const { active, name } = req.body;
    const [skill] = await db.update(specialtySkillsTable)
      .set({ ...(active !== undefined ? { active } : {}), ...(name ? { name } : {}) })
      .where(eq(specialtySkillsTable.id, id))
      .returning();
    res.json(skill);
  } catch { res.status(500).json({ error: "Erro ao atualizar skill." }); }
});

// PATCH /admin/specialties/categories/:id
router.patch("/admin/specialties/categories/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
    const id = parseInt(req.params["id"] as string);
    const { active, name, icon, description } = req.body;
    const [cat] = await db.update(specialtyCategoriesTable)
      .set({ ...(active !== undefined ? { active } : {}), ...(name ? { name } : {}), ...(icon ? { icon } : {}), ...(description ? { description } : {}) })
      .where(eq(specialtyCategoriesTable.id, id))
      .returning();
    res.json(cat);
  } catch { res.status(500).json({ error: "Erro ao atualizar categoria." }); }
});

export default router;
