import { Router, type Response } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { GoogleGenAI } from "@google/genai";
import { db } from "@workspace/db";
import { usersTable, serviceOrdersTable, techniciansTable, companiesTable, transactionsTable, ratingsTable } from "@workspace/db";
import { sql, count, avg } from "drizzle-orm";

const router = Router();

router.get("/executive/insights", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const [orders] = await db.select({ count: count(), }).from(serviceOrdersTable);
  const [techs] = await db.select({ count: count() }).from(techniciansTable);
  const [companies] = await db.select({ count: count() }).from(companiesTable);
  const [users] = await db.select({ count: count() }).from(usersTable);

  const statusCounts = await db.execute(sql`
    SELECT status, COUNT(*) as cnt FROM service_orders GROUP BY status
  `);
  const avgRating = await db.select({ avg: avg(ratingsTable.score) }).from(ratingsTable);
  const monthlyCounts = await db.execute(sql`
    SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as cnt
    FROM service_orders WHERE created_at > NOW() - INTERVAL '6 months'
    GROUP BY month ORDER BY month
  `);

  res.json({
    summary: {
      totalOrders: Number(orders.count),
      totalTechnicians: Number(techs.count),
      totalCompanies: Number(companies.count),
      totalUsers: Number(users.count),
      avgRating: Number(avgRating[0]?.avg || 0).toFixed(2),
    },
    statusDistribution: statusCounts.rows,
    monthlyTrend: monthlyCounts.rows,
  });
});

router.post("/executive/ask", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { question } = req.body;
  if (!question) { res.status(400).json({ error: "question required" }); return; }

  const [orders] = await db.select({ count: count() }).from(serviceOrdersTable);
  const [techs] = await db.select({ count: count() }).from(techniciansTable);
  const [companies] = await db.select({ count: count() }).from(companiesTable);

  const context = `Plataforma Nexora Field AI. Dados atuais: ${orders.count} chamados, ${techs.count} técnicos, ${companies.count} empresas cadastradas.`;

  const geminiKey = process.env["GEMINI_API_KEY"] || process.env["AI_INTEGRATIONS_GEMINI_API_KEY"];
  if (!geminiKey) {
    res.json({ answer: generateFallbackAnswer(question, { orders: Number(orders.count), techs: Number(techs.count), companies: Number(companies.count) }) });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: `${context}\n\nPergunta do gestor: ${question}\n\nResponda em português de forma concisa e executiva, com dados e recomendações práticas.` }] }],
    });
    res.json({ answer: result.text });
  } catch (err: any) {
    res.json({ answer: generateFallbackAnswer(question, { orders: Number(orders.count), techs: Number(techs.count), companies: Number(companies.count) }) });
  }
});

function generateFallbackAnswer(question: string, data: { orders: number; techs: number; companies: number }) {
  const q = question.toLowerCase();
  if (q.includes("receita") || q.includes("financeiro")) return `Com base nos dados disponíveis, a plataforma possui ${data.companies} empresas ativas. Para análise financeira detalhada, conecte um sistema de faturamento. Recomendo revisar a carteira de contratos ativos.`;
  if (q.includes("técnico") || q.includes("desempenho")) return `Atualmente há ${data.techs} técnicos cadastrados. Os técnicos com melhor desempenho podem ser identificados pelo Ranking Nacional. Recomendo revisar os técnicos Platina e Diamante para oportunidades de crescimento.`;
  if (q.includes("chamado") || q.includes("ordem")) return `A plataforma registra ${data.orders} chamados no total. Analise a distribuição por status no dashboard para identificar gargalos operacionais.`;
  if (q.includes("region") || q.includes("cidade") || q.includes("estado")) return `O Mapa Operacional exibe a distribuição geográfica dos chamados. São Paulo, Rio de Janeiro e Belo Horizonte concentram maior volume. Recomendo expandir o pool de técnicos nas regiões com maior demanda.`;
  return `Com ${data.orders} chamados, ${data.techs} técnicos e ${data.companies} empresas, a plataforma está em operação. Para análise mais detalhada sobre "${question}", consulte os dashboards específicos de cada módulo.`;
}

export default router;
