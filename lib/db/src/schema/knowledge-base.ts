import { pgTable, text, serial, timestamp, integer, pgEnum, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";

export const docCategoryEnum = pgEnum("doc_category", [
  "procedimento", "manual", "sop", "checklist", "norma", "cat", "tutorial"
]);

export const knowledgeDocumentsTable = pgTable("knowledge_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: docCategoryEnum("category").notNull(),
  specialty: text("specialty"),
  content: text("content").notNull(),
  tags: text("tags").array().notNull().default([]),
  authorId: integer("author_id").references(() => usersTable.id, { onDelete: "set null" }),
  published: boolean("published").notNull().default(true),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertKnowledgeDocumentSchema = createInsertSchema(knowledgeDocumentsTable).omit({ id: true, createdAt: true, updatedAt: true, views: true });
export type KnowledgeDocument = typeof knowledgeDocumentsTable.$inferSelect;
