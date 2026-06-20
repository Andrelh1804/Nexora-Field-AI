import { pgTable, text, serial, timestamp, integer, real, pgEnum, boolean, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { companiesTable } from "./companies";
import { createInsertSchema } from "drizzle-zod";

export const leadStatusEnum = pgEnum("lead_status", ["novo", "qualificado", "proposta", "negociacao", "ganho", "perdido"]);
export const leadSourceEnum = pgEnum("lead_source", ["organico", "indicacao", "linkedin", "google", "evento", "cold_outreach", "outro"]);

export const crmLeadsTable = pgTable("crm_leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  position: text("position"),
  source: leadSourceEnum("source").notNull().default("organico"),
  status: leadStatusEnum("status").notNull().default("novo"),
  estimatedValue: real("estimated_value"),
  notes: text("notes"),
  ownerId: integer("owner_id").references(() => usersTable.id, { onDelete: "set null" }),
  convertedCompanyId: integer("converted_company_id").references(() => companiesTable.id, { onDelete: "set null" }),
  tags: text("tags").array().notNull().default([]),
  nextFollowUp: timestamp("next_follow_up"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const crmActivitiesTable = pgTable("crm_activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => crmLeadsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCrmLeadSchema = createInsertSchema(crmLeadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type CrmLead = typeof crmLeadsTable.$inferSelect;
export type CrmActivity = typeof crmActivitiesTable.$inferSelect;
