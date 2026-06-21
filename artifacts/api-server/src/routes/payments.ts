import { Router, type Response } from "express";
import { db, plansTable, subscriptionsTable, walletsTable, transactionsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import crypto from "crypto";

const router = Router();

function getMPClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) return null;
  try {
    const { MercadoPagoConfig } = require("mercadopago");
    return new MercadoPagoConfig({ accessToken });
  } catch {
    return null;
  }
}

async function getOrCreateWallet(userId: number) {
  const [existing] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(walletsTable).values({ userId, balance: 0, pendingBalance: 0, blockedBalance: 0, totalEarned: 0, totalWithdrawn: 0 }).returning();
  return created;
}

router.post("/payments/checkout", requireAuth, requireRole("company", "technician", "admin", "admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const { planId, paymentMethod } = req.body as { planId: number; paymentMethod?: "pix" | "card" | "both" };
    const user = req.user!;

    const [plan] = await db.select().from(plansTable).where(and(eq(plansTable.id, planId), eq(plansTable.active, true))).limit(1);
    if (!plan) { res.status(404).json({ error: "Plano não encontrado." }); return; }

    const mpClient = getMPClient();
    if (!mpClient) {
      res.status(503).json({
        error: "Gateway de pagamento não configurado.",
        hint: "Defina MERCADO_PAGO_ACCESS_TOKEN nas variáveis de ambiente.",
        plan: { id: plan.id, name: plan.name, price: plan.price },
      });
      return;
    }

    const { Preference } = require("mercadopago");
    const preference = new Preference(mpClient);

    const excludedMethods: { id: string }[] = [];
    if (paymentMethod === "pix") excludedMethods.push({ id: "credit_card" }, { id: "debit_card" });
    if (paymentMethod === "card") excludedMethods.push({ id: "bank_transfer" });

    const result = await preference.create({
      body: {
        items: [{
          id: String(plan.id),
          title: `Nexora Field AI — Plano ${plan.name}`,
          description: plan.description ?? `Assinatura mensal do plano ${plan.name}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: plan.price,
        }],
        payer: {
          email: user.email,
          name: user.name,
        },
        payment_methods: {
          excluded_payment_methods: excludedMethods,
          installments: 1,
        },
        back_urls: {
          success: `${process.env.APP_URL ?? ""}/payment-status?status=approved&planId=${plan.id}`,
          failure: `${process.env.APP_URL ?? ""}/payment-status?status=failure&planId=${plan.id}`,
          pending: `${process.env.APP_URL ?? ""}/payment-status?status=pending&planId=${plan.id}`,
        },
        auto_return: "approved",
        notification_url: `${process.env.API_URL ?? ""}/api/payments/webhook`,
        metadata: {
          userId: user.id,
          planId: plan.id,
          type: "subscription",
        },
        statement_descriptor: "NEXORA FIELD AI",
      },
    });

    res.json({
      checkoutUrl: result.init_point,
      sandboxUrl: result.sandbox_init_point,
      preferenceId: result.id,
      plan: { id: plan.id, name: plan.name, price: plan.price },
    });
  } catch (err: any) {
    console.error("[payments/checkout]", err);
    res.status(500).json({ error: "Erro ao criar checkout." });
  }
});

router.post("/payments/subscription/recurring", requireAuth, requireRole("company"), async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.body as { planId: number };
    const user = req.user!;

    const [plan] = await db.select().from(plansTable).where(and(eq(plansTable.id, planId), eq(plansTable.active, true))).limit(1);
    if (!plan) { res.status(404).json({ error: "Plano não encontrado." }); return; }

    const mpClient = getMPClient();
    if (!mpClient) {
      res.status(503).json({ error: "Gateway de pagamento não configurado.", hint: "Defina MERCADO_PAGO_ACCESS_TOKEN." });
      return;
    }

    const { PreApproval } = require("mercadopago");
    const preApproval = new PreApproval(mpClient);

    const result = await preApproval.create({
      body: {
        reason: `Nexora Field AI — Plano ${plan.name}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: plan.price,
          currency_id: "BRL",
        },
        payer_email: user.email,
        back_url: `${process.env.APP_URL ?? ""}/payment-status?status=approved&planId=${plan.id}`,
        notification_url: `${process.env.API_URL ?? ""}/api/payments/webhook`,
        external_reference: `nexora_sub_${user.id}_${plan.id}`,
        status: "pending",
      },
    });

    res.json({
      subscriptionUrl: result.init_point,
      preApprovalId: result.id,
      plan: { id: plan.id, name: plan.name, price: plan.price },
    });
  } catch (err: any) {
    console.error("[payments/subscription]", err);
    res.status(500).json({ error: "Erro ao criar assinatura recorrente." });
  }
});

router.post("/payments/webhook", async (req, res) => {
  try {
    const { type, data, action } = req.body as {
      type: string;
      action?: string;
      data?: { id: string };
    };

    const mpClient = getMPClient();
    if (!mpClient) { res.sendStatus(200); return; }

    if (type === "payment" && data?.id) {
      const { Payment } = require("mercadopago");
      const paymentApi = new Payment(mpClient);
      const payment = await paymentApi.get({ id: data.id });

      const status = payment.status;
      const metadata = payment.metadata as { user_id?: number; plan_id?: number } | undefined;
      const userId = metadata?.user_id ? Number(metadata.user_id) : null;
      const planId = metadata?.plan_id ? Number(metadata.plan_id) : null;
      const amount = Number(payment.transaction_amount ?? 0);

      if (status === "approved" && userId && planId) {
        const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, planId)).limit(1);
        if (plan) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);

          const [existingSub] = await db.select().from(subscriptionsTable)
            .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.planId, planId)))
            .limit(1);

          if (existingSub) {
            await db.update(subscriptionsTable)
              .set({ status: "ativa", currentPeriodEnd: expiresAt, mercadoPagoPaymentId: String(data.id) })
              .where(eq(subscriptionsTable.id, existingSub.id));
          } else {
            await db.insert(subscriptionsTable).values({
              userId,
              planId,
              status: "ativa",
              currentPeriodEnd: expiresAt,
              mercadoPagoPaymentId: String(data.id),
            });
          }

          const wallet = await getOrCreateWallet(userId);
          await db.insert(transactionsTable).values({
            walletId: wallet.id,
            userId,
            type: "assinatura",
            amount,
            description: `Assinatura Plano ${plan.name} — MP #${data.id}`,
            mercadoPagoPaymentId: String(data.id),
          });
        }
      }

      if ((status === "refunded" || status === "cancelled" || status === "charged_back") && userId) {
        await db.update(subscriptionsTable)
          .set({ status: "cancelada" })
          .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.status, "ativa")));
      }
    }

    if ((type === "subscription_preapproval" || action === "updated") && data?.id) {
      const { PreApproval } = require("mercadopago");
      const preApproval = new PreApproval(mpClient);
      const sub = await preApproval.get({ id: data.id });
      const extRef = sub.external_reference as string | undefined;
      if (extRef) {
        const parts = extRef.split("_");
        const userId = Number(parts[2]);
        const planId = Number(parts[3]);
        const mpStatus = sub.status;
        const subStatus = mpStatus === "authorized" ? "ativa" : mpStatus === "cancelled" ? "cancelada" : "pendente";
        if (userId && planId) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          await db.update(subscriptionsTable)
            .set({ status: subStatus, currentPeriodEnd: expiresAt, mercadoPagoSubscriptionId: String(data.id) })
            .where(and(eq(subscriptionsTable.userId, userId), eq(subscriptionsTable.planId, planId)));
        }
      }
    }

    res.sendStatus(200);
  } catch (err: any) {
    console.error("[payments/webhook]", err);
    res.sendStatus(200);
  }
});

router.get("/payments/status/:paymentId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const paymentId = req.params["paymentId"] as string;
    const mpClient = getMPClient();
    if (!mpClient) {
      res.status(503).json({ error: "Gateway não configurado." }); return;
    }
    const { Payment } = require("mercadopago");
    const paymentApi = new Payment(mpClient);
    const payment = await paymentApi.get({ id: paymentId });
    res.json({
      id: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      amount: payment.transaction_amount,
      method: payment.payment_method_id,
      paidAt: payment.date_approved,
    });
  } catch (err: any) {
    console.error("[payments/status]", err);
    res.status(500).json({ error: "Erro ao consultar pagamento." });
  }
});

router.delete("/payments/subscription/:planId", requireAuth, requireRole("company"), async (req: AuthRequest, res: Response) => {
  try {
    const planId = parseInt(req.params["planId"] as string);
    const user = req.user!;
    const [sub] = await db.select().from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.userId, user.id), eq(subscriptionsTable.planId, planId), eq(subscriptionsTable.status, "ativa")))
      .limit(1);
    if (!sub) { res.status(404).json({ error: "Assinatura ativa não encontrada." }); return; }

    const mpClient = getMPClient();
    if (mpClient && sub.mercadoPagoSubscriptionId) {
      try {
        const { PreApproval } = require("mercadopago");
        const preApproval = new PreApproval(mpClient);
        await preApproval.update({ id: sub.mercadoPagoSubscriptionId, body: { status: "cancelled" } });
      } catch (mpErr) {
        console.warn("[payments/cancel] MP cancel failed:", mpErr);
      }
    }

    await db.update(subscriptionsTable)
      .set({ status: "cancelada" })
      .where(eq(subscriptionsTable.id, sub.id));

    res.json({ success: true, message: "Assinatura cancelada." });
  } catch (err: any) {
    console.error("[payments/cancel]", err);
    res.status(500).json({ error: "Erro ao cancelar assinatura." });
  }
});

router.get("/payments/my-subscription", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const [sub] = await db
      .select({ sub: subscriptionsTable, plan: plansTable })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .where(and(eq(subscriptionsTable.userId, user.id), eq(subscriptionsTable.status, "ativa")))
      .limit(1);
    res.json(sub ?? null);
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao buscar assinatura." });
  }
});

export default router;
