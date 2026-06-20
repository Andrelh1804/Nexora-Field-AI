import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { generateToken, requireAuth, type AuthRequest } from "../middlewares/auth";
import { type Response } from "express";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "Todos os campos são obrigatórios." });
      return;
    }

    if (name.trim().length < 2) {
      res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "E-mail inválido." });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
      return;
    }

    const publicRoles = ["company", "technician"];
    if (!publicRoles.includes(role)) {
      res.status(403).json({ error: "Perfil não permitido no cadastro público." });
      return;
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing) {
      res.status(400).json({ error: "Este e-mail já está em uso." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(usersTable)
      .values({ name: name.trim(), email: email.toLowerCase(), passwordHash, role })
      .returning();

    const token = generateToken(user.id, user.role);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "E-mail e senha são obrigatórios." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Formato de e-mail inválido." });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "E-mail ou senha incorretos." });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "E-mail ou senha incorretos." });
      return;
    }

    const token = generateToken(user.id, user.role);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword, createdAt: user.createdAt },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "Usuário não encontrado." });
      return;
    }

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword, createdAt: user.createdAt });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

router.patch("/auth/change-password", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Senha atual e nova senha são obrigatórias." });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: "A nova senha deve ter pelo menos 8 caracteres." });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Usuário não encontrado." });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "Senha atual incorreta." });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ error: "A nova senha deve ser diferente da senha atual." });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(usersTable).set({ passwordHash, mustChangePassword: false }).where(eq(usersTable.id, req.userId!));

    res.json({ success: true, message: "Senha alterada com sucesso." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// LGPD — Exportação de dados pessoais (Art. 18, II da LGPD)
router.get("/auth/export-data", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }

    // Collect all user data via raw SQL for portability
    const [techData] = await db.execute(sql`SELECT * FROM technicians WHERE user_id = ${userId} LIMIT 1`);
    const [companyData] = await db.execute(sql`SELECT * FROM companies WHERE user_id = ${userId} LIMIT 1`);
    const ordersData = await db.execute(sql`SELECT id, title, description, category, city, state, status, created_at FROM service_orders WHERE company_id IN (SELECT id FROM companies WHERE user_id = ${userId})`);
    const ratingsData = await db.execute(sql`SELECT score, comment, created_at FROM ratings WHERE technician_id IN (SELECT id FROM technicians WHERE user_id = ${userId})`);
    const transactionsData = await db.execute(sql`SELECT type, amount, description, status, created_at FROM transactions WHERE user_id = ${userId}`);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      legalBasis: "LGPD — Lei nº 13.709/2018 — Art. 18, II (Portabilidade de dados)",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      technicianProfile: techData ?? null,
      companyProfile: companyData ?? null,
      serviceOrders: ordersData ?? [],
      ratings: ratingsData ?? [],
      financialTransactions: transactionsData ?? [],
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="nexorafield-meus-dados-${userId}-${Date.now()}.json"`);
    res.json(exportPayload);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao exportar dados." });
  }
});

// LGPD — Exclusão de conta (Art. 18, VI da LGPD — Direito ao apagamento)
router.delete("/auth/account", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;
    const userId = req.userId!;

    if (!password) {
      res.status(400).json({ error: "Confirmação de senha é obrigatória para excluir a conta." });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "Senha incorreta. A exclusão foi cancelada por segurança." });
      return;
    }

    // Cascade deletes will handle related records (FKs configured with onDelete: "cascade")
    await db.delete(usersTable).where(eq(usersTable.id, userId));

    res.json({ success: true, message: "Conta excluída com sucesso. Seus dados foram removidos da plataforma conforme a LGPD." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro ao excluir conta." });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ success: true });
});

export default router;
