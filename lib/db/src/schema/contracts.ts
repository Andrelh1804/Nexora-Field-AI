import { pgTable, text, serial, timestamp, integer, real, boolean, pgEnum } from "drizzle-orm/pg-core";
import { companiesTable } from "./companies";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";

export const contractStatusEnum = pgEnum("contract_status", ["rascunho", "ativo", "suspenso", "encerrado", "renovando"]);

export const contractsTable = pgTable("contracts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  number: text("number").notNull().unique(),
  status: contractStatusEnum("status").notNull().default("rascunho"),
  value: real("value").notNull(),
  monthlyValue: real("monthly_value"),
  maxOrdersPerMonth: integer("max_orders_per_month"),
  slaHours: integer("sla_hours").notNull().default(24),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").notNull().default(false),
  notes: text("notes"),
  signedById: integer("signed_by_id").references(() => usersTable.id, { onDelete: "set null" }),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertContractSchema = createInsertSchema(contractsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type Contract = typeof contractsTable.$inferSelect;
