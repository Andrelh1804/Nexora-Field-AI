import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";

export const copilotSessionsTable = pgTable("copilot_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("Nova conversa"),
  specialty: text("specialty"),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCopilotSessionSchema = createInsertSchema(copilotSessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type CopilotSession = typeof copilotSessionsTable.$inferSelect;
