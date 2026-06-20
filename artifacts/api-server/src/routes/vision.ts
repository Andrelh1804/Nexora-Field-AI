import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { requireAuth } from "../middleware/auth";
import { db } from "@workspace/db";
import { visionAnalysisTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

const ai = new GoogleGenAI({
  apiKey: process.env["AI_INTEGRATIONS_GEMINI_API_KEY"] || process.env["GEMINI_API_KEY"] || "",
  baseURL: process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"],
});

const EQUIPMENT_LIST = [
  "ONU", "OLT", "Switch", "Mikrotik", "Cisco", "Huawei", "Patch Panel",
  "Rack", "Nobreak", "Câmera CFTV", "Sensor Industrial", "Roteador",
  "Modem", "Splitter", "Fibra Óptica", "Caixa de Passagem", "DIO"
];

const DEFECT_LIST = [
  "conector mal instalado", "cabo rompido", "oxidação",
  "equipamento danificado", "ausência de componentes",
  "instalação fora do padrão", "sinal fraco", "curto-circuito",
  "superaquecimento", "pó excessivo", "umidade"
];

router.post("/analyze", requireAuth, async (req, res) => {
  const { imageBase64, imageUrl, mimeType = "image/jpeg", serviceOrderId, notes } = req.body;

  if (!imageBase64 && !imageUrl) {
    res.status(400).json({ error: "imageBase64 or imageUrl required" });
    return;
  }

  try {
    let imagePart: any;
    if (imageBase64) {
      imagePart = {
        inlineData: { data: imageBase64, mimeType },
      };
    } else {
      const resp = await fetch(imageUrl);
      const buf = await resp.arrayBuffer();
      imagePart = {
        inlineData: { data: Buffer.from(buf).toString("base64"), mimeType: resp.headers.get("content-type") || mimeType },
      };
    }

    const prompt = `Você é um especialista técnico em telecomunicações, redes, fibra óptica, CFTV, automação industrial e data center.

Analise esta imagem de equipamento técnico e retorne um JSON com o seguinte formato exato:
{
  "equipmentDetected": "nome do equipamento detectado ou null",
  "manufacturer": "fabricante ou null",
  "model": "modelo ou null",
  "defectsFound": ["lista de defeitos encontrados"],
  "criticality": "baixa" | "media" | "alta" | "critica",
  "confidence": 0.0 a 1.0,
  "diagnosis": "diagnóstico completo em português",
  "recommendations": ["lista de recomendações"],
  "stepByStep": ["passo 1", "passo 2", ...]
}

Equipamentos que pode reconhecer: ${EQUIPMENT_LIST.join(", ")}.
Defeitos que pode detectar: ${DEFECT_LIST.join(", ")}.
${notes ? `Observações do técnico: ${notes}` : ""}

Responda APENAS com o JSON, sem markdown, sem explicações.`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [imagePart, { text: prompt }] }],
    });

    const raw = result.text || "";
    let parsed: any = {};
    try {
      const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        equipmentDetected: "Equipamento não identificado",
        manufacturer: null,
        model: null,
        defectsFound: [],
        criticality: "media" as const,
        confidence: 0.5,
        diagnosis: raw.substring(0, 500),
        recommendations: ["Verificar manualmente o equipamento"],
        stepByStep: ["Inspecionar visualmente o equipamento"],
      };
    }

    const [analysis] = await db.insert(visionAnalysisTable).values({
      userId: req.user!.id,
      serviceOrderId: serviceOrderId ? Number(serviceOrderId) : undefined,
      imageUrl: imageUrl || "base64",
      equipmentDetected: parsed.equipmentDetected,
      manufacturer: parsed.manufacturer,
      model: parsed.model,
      defectsFound: parsed.defectsFound || [],
      criticality: parsed.criticality || "media",
      confidence: parsed.confidence,
      diagnosis: parsed.diagnosis,
      recommendations: parsed.recommendations || [],
      stepByStep: parsed.stepByStep || [],
      rawResponse: parsed,
    }).returning();

    res.json(analysis);
  } catch (err: any) {
    req.log.error({ err }, "vision analysis failed");
    res.status(500).json({ error: "Vision analysis failed", details: err.message });
  }
});

router.get("/history", requireAuth, async (req, res) => {
  const analyses = await db.select()
    .from(visionAnalysisTable)
    .where(eq(visionAnalysisTable.userId, req.user!.id))
    .orderBy(desc(visionAnalysisTable.createdAt))
    .limit(20);
  res.json(analyses);
});

export default router;
