import { Router, type Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { db } from "@workspace/db";
import { copilotSessionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

const ai = new GoogleGenAI({
  apiKey: process.env["AI_INTEGRATIONS_GEMINI_API_KEY"] || process.env["GEMINI_API_KEY"] || "",
});

const SYSTEM_PROMPT = `Você é o Nexora Copilot, um assistente técnico especialista em:
- Telecomunicações e Fibra Óptica (GPON, EPON, ONU, OLT, splitter)
- Redes de Dados (Cisco, Mikrotik, Huawei, switches, roteadores, VLANs, BGP, OSPF)
- CFTV e Segurança Eletrônica (câmeras IP, DVR, NVR, acesso)
- Automação Industrial (CLP, SCADA, sensores, atuadores)
- Data Center (rack, patch panel, cabeamento estruturado, energia)
- Energia Solar (inversores, módulos, string box, MPPT)

Princípios:
- Responda sempre em português brasileiro
- Seja técnico e preciso
- Forneça passos práticos e acionáveis
- Cite normas técnicas quando relevante (ABNT, ANATEL, etc.)
- Se não souber algo, diga claramente
- Organize respostas longas com tópicos/listas
- Pergunte por mais detalhes quando necessário para dar um diagnóstico preciso`;

router.get("/sessions", requireAuth, async (req: AuthRequest, res: Response) => {
  const sessions = await db.select()
    .from(copilotSessionsTable)
    .where(eq(copilotSessionsTable.userId, req.userId!))
    .orderBy(desc(copilotSessionsTable.updatedAt))
    .limit(20);
  res.json(sessions);
});

router.post("/sessions", requireAuth, async (req: AuthRequest, res: Response) => {
  const { specialty } = req.body;
  const [session] = await db.insert(copilotSessionsTable).values({
    userId: req.userId!,
    title: "Nova conversa",
    specialty: specialty || null,
    messages: [],
  }).returning();
  res.json(session);
});

router.post("/sessions/:id/chat", requireAuth, async (req: AuthRequest, res: Response) => {
  const sessionId = Number(req.params["id"]);
  const { message } = req.body;

  if (!message) {
    res.status(400).json({ error: "message required" });
    return;
  }

  const [session] = await db.select().from(copilotSessionsTable)
    .where(eq(copilotSessionsTable.id, sessionId));

  if (!session || session.userId !== req.userId!) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const history = (session.messages as any[]) || [];
  const userMsg = { role: "user", content: message, at: new Date().toISOString() };
  const updatedHistory = [...history, userMsg];

  try {
    const contents = [
      { role: "user" as const, parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model" as const, parts: [{ text: "Entendido! Sou o Nexora Copilot. Como posso ajudar você hoje?" }] },
      ...history.map((m: any) => ({
        role: m.role === "user" ? "user" as const : "model" as const,
        parts: [{ text: m.content }],
      })),
      { role: "user" as const, parts: [{ text: message }] },
    ];

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    const reply = result.text || "Desculpe, não consegui processar sua mensagem.";
    const assistantMsg = { role: "assistant", content: reply, at: new Date().toISOString() };
    const finalHistory = [...updatedHistory, assistantMsg];

    const title = history.length === 0 ? message.substring(0, 50) : session.title;

    await db.update(copilotSessionsTable)
      .set({ messages: finalHistory, title, updatedAt: new Date() })
      .where(eq(copilotSessionsTable.id, sessionId));

    res.json({ message: reply, sessionId });
  } catch (err: any) {
    req.log.error({ err }, "copilot chat failed");
    const fallback = `Desculpe, houve um erro na conexão com a IA. Por favor, tente novamente. (${err.message?.substring(0, 100)})`;
    res.json({ message: fallback, sessionId });
  }
});

router.delete("/sessions/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const sessionId = Number(req.params["id"]);
  await db.delete(copilotSessionsTable).where(eq(copilotSessionsTable.id, sessionId));
  res.json({ ok: true });
});

export default router;
