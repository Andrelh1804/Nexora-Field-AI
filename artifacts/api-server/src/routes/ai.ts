import { Router, type Response } from "express";
import { db, serviceOrdersTable, techniciansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

// Lazy Gemini client to avoid startup crash if env not set
async function getGeminiClient() {
  const { GoogleGenAI } = await import("@google/genai");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  return new GoogleGenAI({ apiKey });
}

// AI classification of a service order
router.post("/ai/classify/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [order] = await db.select().from(serviceOrdersTable).where(eq(serviceOrdersTable.id, id)).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    try {
      const ai = await getGeminiClient();
      const prompt = `
        Você é um especialista em Field Service Management.
        Analise este chamado técnico e retorne JSON com:
        - category: uma de [fibra_optica, redes, infraestrutura, automacao_industrial, cftv, telecom]
        - complexity: uma de [baixa, media, alta]
        - estimatedHours: número de horas estimadas
        - reasoning: explicação breve em português

        Chamado: "${order.title}"
        Descrição: "${order.description}"
        Local: ${order.city}, ${order.state}

        Retorne APENAS JSON válido, sem markdown.
      `;
      const result = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
      const text = result.text || "{}";
      const parsed = JSON.parse(text.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      res.json({ orderId: id, ...parsed, aiGenerated: true });
    } catch (aiErr) {
      // Fallback to heuristic
      res.json({
        orderId: id,
        category: order.category,
        complexity: order.value && order.value > 5000 ? "alta" : order.value && order.value > 1000 ? "media" : "baixa",
        estimatedHours: Math.round((order.value || 1000) / 200),
        reasoning: "Classificação por heurística (IA indisponível)",
        aiGenerated: false,
      });
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// AI pricing suggestion
router.post("/ai/pricing", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, city, state, complexity } = req.body;

    try {
      const ai = await getGeminiClient();
      const prompt = `
        Você é um especialista em precificação de serviços técnicos de campo no Brasil.
        Analise e retorne JSON com:
        - minValue: valor mínimo sugerido em reais (número)
        - idealValue: valor ideal em reais (número)
        - premiumValue: valor premium em reais (número)
        - reasoning: justificativa breve em português

        Serviço: "${title}"
        Descrição: "${description}"
        Categoria: ${category}
        Local: ${city}, ${state}
        Complexidade: ${complexity || "media"}

        Retorne APENAS JSON válido.
      `;
      const result = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
      const text = result.text || "{}";
      const parsed = JSON.parse(text.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      res.json({ ...parsed, aiGenerated: true });
    } catch {
      // Heuristic fallback
      const baseValues: Record<string, number> = {
        fibra_optica: 1500, redes: 2000, infraestrutura: 3000,
        automacao_industrial: 5000, cftv: 1200, telecom: 1800,
      };
      const base = baseValues[category] || 1500;
      res.json({
        minValue: Math.round(base * 0.7),
        idealValue: base,
        premiumValue: Math.round(base * 1.5),
        reasoning: "Estimativa por categoria de serviço",
        aiGenerated: false,
      });
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Enhanced AI match (replaces simple keyword matching)
router.get("/ai/match/:orderId", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = parseInt(req.params["orderId"] as string);
    const [order] = await db.select().from(serviceOrdersTable).where(eq(serviceOrdersTable.id, orderId)).limit(1);
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    const technicians = await db.select().from(techniciansTable).limit(50);
    if (technicians.length === 0) { res.json([]); return; }

    try {
      const ai = await getGeminiClient();
      const techList = technicians.map(t => ({
        id: t.id, name: t.name, specialties: t.specialties,
        city: t.city, state: t.state, rating: t.rating, totalServices: t.totalServices,
      }));

      const prompt = `
        Você é um motor de matching inteligente para Field Service.
        Analise o chamado e retorne os 5 melhores técnicos em ordem de compatibilidade.

        Chamado:
        Título: ${order.title}
        Descrição: ${order.description}
        Categoria: ${order.category}
        Local: ${order.city}, ${order.state}

        Técnicos disponíveis:
        ${JSON.stringify(techList, null, 2)}

        Retorne JSON array com os 5 melhores:
        [{"technicianId": number, "score": 0-100, "reasoning": "string em português"}]

        Considere: especialidades, localização, avaliação e experiência.
        Retorne APENAS JSON válido.
      `;
      const result = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt });
      const text = result.text || "[]";
      const matches = JSON.parse(text.replace(/```json?\n?/g, "").replace(/```/g, "").trim());

      const enriched = matches.map((m: any) => {
        const tech = technicians.find(t => t.id === m.technicianId);
        return { ...m, technician: tech || null };
      }).filter((m: any) => m.technician);

      res.json(enriched);
    } catch {
      // Heuristic fallback
      const scored = technicians.map(t => {
        let score = 0;
        if (t.specialties.includes(order.category)) score += 50;
        if (t.state === order.state) score += 20;
        if (t.city === order.city) score += 15;
        score += Math.min((t.rating || 0) * 5, 15);
        return { technicianId: t.id, score: Math.min(score, 100), reasoning: "Match por especialidade e localização", technician: t };
      });
      const top5 = scored.sort((a, b) => b.score - a.score).slice(0, 5);
      res.json(top5);
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
