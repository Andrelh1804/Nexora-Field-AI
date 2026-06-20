import { pgTable, text, serial, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";

export const postCategoryEnum = pgEnum("post_category", ["duvida", "tutorial", "dica", "anuncio", "debate", "showcase"]);

export const communityPostsTable = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: postCategoryEnum("category").notNull().default("duvida"),
  specialty: text("specialty"),
  tags: text("tags").array().notNull().default([]),
  upvotes: integer("upvotes").notNull().default(0),
  views: integer("views").notNull().default(0),
  pinned: boolean("pinned").notNull().default(false),
  solved: boolean("solved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const communityCommentsTable = pgTable("community_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => communityPostsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  upvotes: integer("upvotes").notNull().default(0),
  accepted: boolean("accepted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPostsTable).omit({ id: true, createdAt: true, updatedAt: true, upvotes: true, views: true, pinned: true, solved: true });
export type CommunityPost = typeof communityPostsTable.$inferSelect;
export type CommunityComment = typeof communityCommentsTable.$inferSelect;
