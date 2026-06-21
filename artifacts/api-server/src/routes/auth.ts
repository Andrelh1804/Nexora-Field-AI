import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, passwordResetTokensTable } from "@workspace/db";
import { eq, sql, and, gt } from "drizzle-orm";
import { generateToken, requireAuth, type AuthRequest } from "../middlewares/auth";
import { type Response } from "express";
import crypto from "crypto";

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
    const techResult = await db.execute(sql`SELECT * FROM technicians WHERE user_id = ${userId} LIMIT 1`);
    const companyResult = await db.execute(sql`SELECT * FROM companies WHERE user_id = ${userId} LIMIT 1`);
    const ordersResult = await db.execute(sql`SELECT id, title, description, category, city, state, status, created_at FROM service_orders WHERE company_id IN (SELECT id FROM companies WHERE user_id = ${userId})`);
    const ratingsResult = await db.execute(sql`SELECT score, comment, created_at FROM ratings WHERE technician_id IN (SELECT id FROM technicians WHERE user_id = ${userId})`);
    const transactionsResult = await db.execute(sql`SELECT type, amount, description, status, created_at FROM transactions WHERE user_id = ${userId}`);
    const techData = techResult.rows?.[0] ?? techResult[0] ?? null;
    const companyData = companyResult.rows?.[0] ?? companyResult[0] ?? null;
    const ordersData = ordersResult.rows ?? ordersResult ?? [];
    const ratingsData = ratingsResult.rows ?? ratingsResult ?? [];
    const transactionsData = transactionsResult.rows ?? transactionsResult ?? [];

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

router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ error: "E-mail é obrigatório." }); return; }

    const [user] = await db.select({ id: usersTable.id, email: usersTable.email, name: usersTable.name })
      .from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);

    if (!user) {
      res.json({ success: true, message: "Se o e-mail estiver cadastrado, você receberá as instruções em breve." });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, user.id));
    await db.insert(passwordResetTokensTable).values({ userId: user.id, tokenHash, expiresAt });

    const resetUrl = `${process.env.APP_URL ?? ""}/redefinir-senha?token=${rawToken}`;

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL ?? "noreply@nexorafield.com.br",
            to: user.email,
            subject: "Recuperação de Senha — Nexora Field AI",
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0e1624;color:#fff;padding:32px;border-radius:12px">
                <h2 style="color:#0A84FF;margin-bottom:8px">Nexora Field AI</h2>
                <h3 style="margin-bottom:16px">Recuperação de Senha</h3>
                <p style="color:#aaa">Olá, ${user.name}. Recebemos uma solicitação para redefinir a senha da sua conta.</p>
                <a href="${resetUrl}" style="display:inline-block;background:#0A84FF;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:24px 0">
                  Redefinir Senha
                </a>
                <p style="color:#888;font-size:12px">Este link expira em 1 hora. Se você não solicitou a recuperação, ignore este e-mail.</p>
                <p style="color:#666;font-size:11px">Link direto: ${resetUrl}</p>
              </div>`,
          }),
        });
      } catch (emailErr) {
        console.error("[forgot-password] Email send failed:", emailErr);
      }
    } else {
      console.log(`[forgot-password] RESEND_API_KEY not set. Reset link for ${user.email}: ${resetUrl}`);
    }

    res.json({ success: true, message: "Se o e-mail estiver cadastrado, você receberá as instruções em breve." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao processar solicitação." });
  }
});

router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) { res.status(400).json({ error: "Token e nova senha são obrigatórios." }); return; }
    if (password.length < 8) { res.status(400).json({ error: "A senha deve ter no mínimo 8 caracteres." }); return; }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();

    const [resetRecord] = await db
      .select({ id: passwordResetTokensTable.id, userId: passwordResetTokensTable.userId, usedAt: passwordResetTokensTable.usedAt })
      .from(passwordResetTokensTable)
      .where(and(eq(passwordResetTokensTable.tokenHash, tokenHash), gt(passwordResetTokensTable.expiresAt, now)))
      .limit(1);

    if (!resetRecord) { res.status(400).json({ error: "Token inválido ou expirado." }); return; }
    if (resetRecord.usedAt) { res.status(400).json({ error: "Este link já foi utilizado." }); return; }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.update(usersTable).set({ passwordHash, mustChangePassword: false }).where(eq(usersTable.id, resetRecord.userId));
    await db.update(passwordResetTokensTable).set({ usedAt: now }).where(eq(passwordResetTokensTable.id, resetRecord.id));

    res.json({ success: true, message: "Senha redefinida com sucesso. Faça login com sua nova senha." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao redefinir senha." });
  }
});

export default router;
