import { Router, type Response } from "express";
import { db } from "@workspace/db";
import { platformSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

// Default values for each settings key
const DEFAULTS: Record<string, Record<string, string>> = {
  company: {
    name: "Nexora Field AI",
    razaoSocial: "Nexora Field AI Ltda.",
    cnpj: "58.453.955/0001-84",
    email: "contato@nexorafield.com.br",
    phone: "(11) 3000-0000",
    whatsapp: "",
    address: "",
    city: "São Paulo",
    state: "SP",
    cep: "",
    country: "Brasil",
    slogan: "Conectando empresas e técnicos especializados com IA",
    description: "Marketplace SaaS de field services impulsionado por Inteligência Artificial.",
    mission: "Transformar o mercado de field services com tecnologia e IA.",
    vision: "Ser a plataforma líder de field services na América Latina.",
    values: "Inovação, Confiança, Excelência, Transparência",
    site: "https://nexorafield.com.br",
  },
  social: {
    instagram: "https://instagram.com/nexorafield",
    facebook: "",
    linkedin: "https://linkedin.com/company/nexorafield",
    youtube: "",
    tiktok: "",
    twitter: "",
    telegram: "",
    github: "",
    site: "https://nexorafield.com.br",
  },
  branding: {
    logoUrl: "/nexora-logo.png",
    logoWhiteUrl: "",
    logoDarkUrl: "",
    faviconUrl: "",
    bannerUrl: "",
    ogImageUrl: "",
    colorPrimary: "#3b82f6",
    colorSecondary: "#6366f1",
    colorAccent: "#06b6d4",
    colorButton: "#3b82f6",
  },
  ai: {
    geminiModel: "gemini-1.5-flash",
    temperature: "0.7",
    maxTokens: "8192",
    promptCopilot: "Você é o Copiloto IA da Nexora Field AI, um assistente especializado em field services técnicos.",
    promptVision: "Você é um especialista em análise visual de equipamentos e instalações técnicas.",
    promptExecutive: "Você é um assistente executivo da Nexora Field AI, especialista em análise de dados e relatórios gerenciais.",
  },
  mercadopago: {
    mode: "sandbox",
    webhookUrl: "",
    publicKey: "",
    // accessToken stored but NOT returned in public endpoint
  },
  whatsapp: {
    twilioNumber: "",
    templates: "",
    // sid/token NOT returned in public endpoint
  },
  email: {
    senderName: "Nexora Field AI",
    senderEmail: "noreply@nexorafield.com.br",
    // apiKey NOT returned in public endpoint
  },
};

// Sensitive keys — never expose in public endpoint
const SENSITIVE_KEYS = new Set(["ai.geminiApiKey", "mercadopago.accessToken", "mercadopago.publicKey", "whatsapp.twilioSid", "whatsapp.twilioToken", "email.resendApiKey"]);

async function getAllSettings(): Promise<Record<string, Record<string, string>>> {
  const rows = await db.select().from(platformSettingsTable);
  const result: Record<string, Record<string, string>> = {};
  // Start with defaults
  for (const [key, val] of Object.entries(DEFAULTS)) {
    result[key] = { ...val };
  }
  // Override with DB values
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.value);
      if (result[row.key]) {
        result[row.key] = { ...result[row.key], ...parsed };
      } else {
        result[row.key] = parsed;
      }
    } catch {
      // ignore malformed JSON
    }
  }
  return result;
}

// ── Public endpoint — safe settings only ────────────────────────────
router.get("/platform-settings/public", async (_req, res) => {
  try {
    const all = await getAllSettings();
    // Remove credentials from public response
    const safe = {
      company: all.company,
      social: all.social,
      branding: all.branding,
    };
    res.json(safe);
  } catch {
    res.status(500).json({ error: "Erro interno." });
  }
});

// ── Admin: get all settings (admin_master only) ─────────────────────
router.get("/admin/platform-settings", requireAuth, requireRole("admin_master"), async (_req: AuthRequest, res: Response) => {
  try {
    const all = await getAllSettings();
    res.json(all);
  } catch {
    res.status(500).json({ error: "Erro interno." });
  }
});

// ── Admin: update a settings group ─────────────────────────────────
router.put("/admin/platform-settings/:key", requireAuth, requireRole("admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const key = req.params["key"] as string;
    const updates = req.body as Record<string, string>;
    const value = JSON.stringify(updates);

    const [existing] = await db.select({ id: platformSettingsTable.id }).from(platformSettingsTable).where(eq(platformSettingsTable.key, key)).limit(1);
    if (existing) {
      await db.update(platformSettingsTable).set({ value }).where(eq(platformSettingsTable.key, key));
    } else {
      await db.insert(platformSettingsTable).values({ key, value });
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

// ── Admin: test AI connection ───────────────────────────────────────
router.post("/admin/platform-settings/test/ai", requireAuth, requireRole("admin_master"), async (req: AuthRequest, res: Response) => {
  try {
    const { geminiApiKey } = req.body;
    const key = geminiApiKey || process.env["GEMINI_API_KEY"] || "";
    if (!key) { res.json({ ok: false, message: "Nenhuma API key configurada." }); return; }
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (r.ok) {
      res.json({ ok: true, message: "✅ Gemini conectado com sucesso!" });
    } else {
      res.json({ ok: false, message: `❌ Erro: ${r.status} ${r.statusText}` });
    }
  } catch (err) {
    res.json({ ok: false, message: `❌ Falha na conexão: ${(err as Error).message}` });
  }
});

// ── Admin: test email ───────────────────────────────────────────────
router.post("/admin/platform-settings/test/email", requireAuth, requireRole("admin_master"), async (req: AuthRequest, res: Response) => {
  res.json({ ok: true, message: "✅ Email de teste enviado (simulado). Configure o Resend para envio real." });
});

export default router;
