import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
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
  const [doc] = await db.select().from(knowledgeDocumentsTable).where(eq(knowledgeDocumentsTable.id, id));
  if (!doc) { res.status(404).json({ error: "Not found" }); return; }

  await db.update(knowledgeDocumentsTable)
    .set({ views: doc.views + 1 })
    .where(eq(knowledgeDocumentsTable.id, id));

  res.json({ ...doc, views: doc.views + 1 });
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { title, category, specialty, content, tags } = req.body;
  const [doc] = await db.insert(knowledgeDocumentsTable).values({
    title, category, specialty, content,
    tags: tags || [],
    authorId: req.user!.id,
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
