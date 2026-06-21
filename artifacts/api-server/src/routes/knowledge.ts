import { Router, type Response } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { db } from "@workspace/db";
import { knowledgeDocumentsTable } from "@workspace/db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { q, category, specialty, limit = "20", offset = "0" } = req.query as Record<string, string>;

  let query = db.select().from(knowledgeDocumentsTable)
    .where(eq(knowledgeDocumentsTable.published, true))
    .$dynamic();

  if (q) {
    query = query.where(
      or(
        ilike(knowledgeDocumentsTable.title, `%${q}%`),
        ilike(knowledgeDocumentsTable.content, `%${q}%`)
      )
    );
  }

  if (category) {
    query = query.where(eq(knowledgeDocumentsTable.category, category as any));
  }

  if (specialty) {
    query = query.where(eq(knowledgeDocumentsTable.specialty, specialty));
  }

  const docs = await query
    .orderBy(desc(knowledgeDocumentsTable.views))
    .limit(Number(limit))
    .offset(Number(offset));

  res.json(docs);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  if (!id || isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const [doc] = await db.select().from(knowledgeDocumentsTable).where(eq(knowledgeDocumentsTable.id, id));
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }

  await db.update(knowledgeDocumentsTable)
    .set({ views: doc.views + 1 })
    .where(eq(knowledgeDocumentsTable.id, id));

  res.json({ ...doc, views: doc.views + 1 });
});

router.post("/ask", requireAuth, async (req: AuthRequest, res: Response) => {
  const { question } = req.body;
  if (!question) { res.status(400).json({ error: "Pergunta obrigatória" }); return; }
  const docs = await db.select().from(knowledgeDocumentsTable)
    .where(eq(knowledgeDocumentsTable.published, true))
    .orderBy(desc(knowledgeDocumentsTable.views))
    .limit(5);
  const context = docs.map(d => `## ${d.title}\n${d.content}`).join("\n\n---\n\n");
  res.json({
    answer: `Com base na base de conhecimento Nexora: ${docs.length > 0 ? "Encontrei " + docs.length + " artigos relevantes. Consulte os documentos abaixo para mais detalhes." : "Nenhum artigo encontrado. Consulte a equipe de suporte."}`,
    docs: docs.slice(0, 3),
  });
});

router.post("/", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { title, category, specialty, content, tags } = req.body;
  const [doc] = await db.insert(knowledgeDocumentsTable).values({
    title, category, specialty, content,
    tags: tags || [],
    authorId: req.userId!,
    published: true,
  }).returning();
  res.json(doc);
});

router.put("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = Number(req.params["id"]);
  const { title, category, specialty, content, tags, published } = req.body;
  const [doc] = await db.update(knowledgeDocumentsTable)
    .set({ title, category, specialty, content, tags, published, updatedAt: new Date() })
    .where(eq(knowledgeDocumentsTable.id, id))
    .returning();
  res.json(doc);
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  await db.delete(knowledgeDocumentsTable).where(eq(knowledgeDocumentsTable.id, Number(req.params["id"])));
  res.json({ ok: true });
});

export default router;
