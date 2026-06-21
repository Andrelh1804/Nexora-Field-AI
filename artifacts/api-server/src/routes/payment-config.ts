import { Router, type Response } from "express";
import { db } from "@workspace/db";
import { paymentConfigsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

const GATEWAYS = [
  { gateway: "mercado_pago", displayName: "Mercado Pago" },
  { gateway: "stripe", displayName: "Stripe" },
  { gateway: "pix_manual", displayName: "Pix Manual" },
  { gateway: "pagseguro", displayName: "PagSeguro" },
  { gateway: "asaas", displayName: "Asaas" },
] as const;

async function ensureDefaults() {
  for (const g of GATEWAYS) {
    const [existing] = await db
      .select()
      .from(paymentConfigsTable)
      .where(eq(paymentConfigsTable.gateway, g.gateway))
      .limit(1);
    if (!existing) {
      await db.insert(paymentConfigsTable).values({
        gateway: g.gateway,
        displayName: g.displayName,
        enabled: false,
        sandboxMode: true,
      });
    }
  }
}

router.get(
  "/admin/payment-config",
  requireAuth,
  requireRole("admin", "admin_master"),
  async (_req: AuthRequest, res: Response) => {
    try {
      await ensureDefaults();
      const configs = await db.select().from(paymentConfigsTable).orderBy(paymentConfigsTable.id);
      const masked = configs.map((c) => ({
        ...c,
        secretKey: c.secretKey ? maskSecret(c.secretKey) : null,
        accessToken: c.accessToken ? maskSecret(c.accessToken) : null,
        webhookSecret: c.webhookSecret ? maskSecret(c.webhookSecret) : null,
      }));
      res.json(masked);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar configurações de pagamento." });
    }
  }
);

router.get(
  "/admin/payment-config/:gateway",
  requireAuth,
  requireRole("admin", "admin_master"),
  async (req: AuthRequest, res: Response) => {
    try {
      const gateway = req.params["gateway"] as string;
      const [config] = await db
        .select()
        .from(paymentConfigsTable)
        .where(eq(paymentConfigsTable.gateway, gateway as any))
        .limit(1);
      if (!config) { res.status(404).json({ error: "Gateway não encontrado." }); return; }
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar configuração." });
    }
  }
);

router.put(
  "/admin/payment-config/:gateway",
  requireAuth,
  requireRole("admin", "admin_master"),
  async (req: AuthRequest, res: Response) => {
    try {
      const gateway = req.params["gateway"] as string;
      const body = req.body as Record<string, unknown>;

      const [existing] = await db
        .select()
        .from(paymentConfigsTable)
        .where(eq(paymentConfigsTable.gateway, gateway as any))
        .limit(1);

      const updates: Record<string, unknown> = {
        enabled: body.enabled ?? existing?.enabled ?? false,
        sandboxMode: body.sandboxMode ?? existing?.sandboxMode ?? true,
        displayName: body.displayName ?? existing?.displayName,
        pixKey: body.pixKey ?? existing?.pixKey ?? null,
        pixKeyType: body.pixKeyType ?? existing?.pixKeyType ?? null,
        pixBeneficiaryName: body.pixBeneficiaryName ?? existing?.pixBeneficiaryName ?? null,
        pixBeneficiaryCity: body.pixBeneficiaryCity ?? existing?.pixBeneficiaryCity ?? null,
        extraConfig: body.extraConfig ?? existing?.extraConfig ?? null,
      };

      if (body.publicKey !== undefined && !ismasked(String(body.publicKey)))
        updates.publicKey = body.publicKey || null;
      if (body.secretKey !== undefined && !ismasked(String(body.secretKey)))
        updates.secretKey = body.secretKey || null;
      if (body.accessToken !== undefined && !ismasked(String(body.accessToken)))
        updates.accessToken = body.accessToken || null;
      if (body.webhookSecret !== undefined && !ismasked(String(body.webhookSecret)))
        updates.webhookSecret = body.webhookSecret || null;

      if (!existing) {
        const [created] = await db
          .insert(paymentConfigsTable)
          .values({ gateway: gateway as any, displayName: String(updates.displayName || gateway), ...updates })
          .returning();
        res.json(created);
      } else {
        const [updated] = await db
          .update(paymentConfigsTable)
          .set(updates)
          .where(eq(paymentConfigsTable.gateway, gateway as any))
          .returning();
        res.json(updated);
      }
    } catch (err) {
      res.status(500).json({ error: "Erro ao salvar configuração." });
    }
  }
);

router.get(
  "/admin/payment-config-status",
  requireAuth,
  requireRole("admin", "admin_master"),
  async (_req: AuthRequest, res: Response) => {
    try {
      await ensureDefaults();
      const configs = await db.select().from(paymentConfigsTable);
      const status = configs.map((c) => ({
        gateway: c.gateway,
        displayName: c.displayName,
        enabled: c.enabled,
        sandboxMode: c.sandboxMode,
        hasKeys: !!(c.secretKey || c.accessToken || c.pixKey),
      }));
      res.json(status);
    } catch {
      res.status(500).json({ error: "Erro ao buscar status." });
    }
  }
);

function maskSecret(value: string): string {
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "••••••••••••" + value.slice(-4);
}

function ismasked(value: string): boolean {
  return value.includes("••••");
}

export default router;
