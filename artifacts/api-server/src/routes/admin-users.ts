import { Router, type Response } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, ne, and, or, ilike, desc } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

const ADMIN_ROLES = ["admin", "admin_master"];

router.get("/admin/users", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const { role, search } = req.query as { role?: string; search?: string };
    let query = db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      isActive: usersTable.isActive,
      mustChangePassword: usersTable.mustChangePassword,
      createdAt: usersTable.createdAt,
    }).from(usersTable);

    const conditions = [];
    if (role) conditions.push(eq(usersTable.role, role as any));
    if (search) conditions.push(or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.email, `%${search}%`)));

    const users = conditions.length
      ? await query.where(and(...conditions)).orderBy(desc(usersTable.createdAt))
      : await query.orderBy(desc(usersTable.createdAt));

    res.json(users);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

router.get("/admin/users/:id", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [user] = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      isActive: usersTable.isActive,
      mustChangePassword: usersTable.mustChangePassword,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.id, id)).limit(1);

    if (!user) { res.status(404).json({ error: "Usuário não encontrado." }); return; }
    res.json(user);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

router.post("/admin/users", requireAuth, requireRole("admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "Todos os campos são obrigatórios." });
      return;
    }

    const allowedRoles = ["admin", "admin_master", "company", "technician"];
    if (!allowedRoles.includes(role)) {
      res.status(400).json({ error: "Role inválido." });
      return;
    }

    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing) { res.status(400).json({ error: "E-mail já em uso." }); return; }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(usersTable).values({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
      role,
      mustChangePassword: true,
    }).returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      isActive: usersTable.isActive,
      createdAt: usersTable.createdAt,
    });

    res.status(201).json(user);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

router.patch("/admin/users/:id", requireAuth, requireRole("admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const { name, email, role, isActive, resetPassword } = req.body;

    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!target) { res.status(404).json({ error: "Usuário não encontrado." }); return; }

    if (target.role === "admin_master" && req.userRole !== "admin_master") {
      res.status(403).json({ error: "Não é possível editar um Admin Master." });
      return;
    }

    if (role === "admin_master" && req.userRole !== "admin_master") {
      res.status(403).json({ error: "Somente Admin Master pode promover outros a Admin Master." });
      return;
    }

    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase();
    if (role) updates.role = role;
    if (typeof isActive === "boolean") updates.isActive = isActive;
    if (resetPassword) {
      updates.passwordHash = await bcrypt.hash(resetPassword, 12);
      updates.mustChangePassword = true;
    }

    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      isActive: usersTable.isActive,
      mustChangePassword: usersTable.mustChangePassword,
      createdAt: usersTable.createdAt,
    });

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

router.delete("/admin/users/:id", requireAuth, requireRole("admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    if (id === req.userId) { res.status(400).json({ error: "Não é possível remover seu próprio usuário." }); return; }

    const [target] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!target) { res.status(404).json({ error: "Usuário não encontrado." }); return; }
    if (target.role === "admin_master") { res.status(403).json({ error: "Não é possível remover um Admin Master." }); return; }

    await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.id, id));
    res.json({ success: true, message: "Usuário desativado." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

export default router;
