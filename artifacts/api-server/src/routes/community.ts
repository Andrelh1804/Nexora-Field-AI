import { Router, type Response } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { db } from "@workspace/db";
import { communityPostsTable, communityCommentsTable, usersTable } from "@workspace/db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";

const router = Router();

router.get("/community/posts", async (req, res) => {
  const { q, category, specialty, limit = "20", offset = "0" } = req.query as Record<string, string>;
  let query = db.select({ post: communityPostsTable, author: { name: usersTable.name, role: usersTable.role } })
    .from(communityPostsTable)
    .leftJoin(usersTable, eq(communityPostsTable.authorId, usersTable.id))
    .$dynamic();
  if (category) query = query.where(eq(communityPostsTable.category, category as any));
  if (specialty) query = query.where(eq(communityPostsTable.specialty, specialty));
  if (q) query = query.where(or(ilike(communityPostsTable.title, `%${q}%`), ilike(communityPostsTable.content, `%${q}%`)));
  const posts = await query.orderBy(desc(communityPostsTable.pinned), desc(communityPostsTable.createdAt)).limit(Number(limit)).offset(Number(offset));
  res.json(posts);
});

router.get("/community/posts/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const [post] = await db.select().from(communityPostsTable).where(eq(communityPostsTable.id, id));
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(communityPostsTable).set({ views: post.views + 1 }).where(eq(communityPostsTable.id, id));
  const comments = await db.select({ comment: communityCommentsTable, author: { name: usersTable.name, role: usersTable.role } })
    .from(communityCommentsTable).leftJoin(usersTable, eq(communityCommentsTable.authorId, usersTable.id))
    .where(eq(communityCommentsTable.postId, id)).orderBy(desc(communityCommentsTable.accepted), desc(communityCommentsTable.upvotes));
  res.json({ ...post, views: post.views + 1, comments });
});

router.post("/community/posts", requireAuth, async (req: AuthRequest, res: Response) => {
  const { title, content, category, specialty, tags } = req.body;
  const [post] = await db.insert(communityPostsTable).values({ title, content, category: category || "duvida", specialty, tags: tags || [], authorId: req.userId! }).returning();
  res.json(post);
});

router.post("/community/posts/:id/upvote", requireAuth, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params["id"]);
  const [post] = await db.select().from(communityPostsTable).where(eq(communityPostsTable.id, id));
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(communityPostsTable).set({ upvotes: post.upvotes + 1 }).where(eq(communityPostsTable.id, id));
  res.json({ ok: true });
});

router.post("/community/posts/:id/comments", requireAuth, async (req: AuthRequest, res: Response) => {
  const [comment] = await db.insert(communityCommentsTable).values({ postId: Number(req.params["id"]), authorId: req.userId!, content: req.body.content }).returning();
  res.json(comment);
});

export default router;
