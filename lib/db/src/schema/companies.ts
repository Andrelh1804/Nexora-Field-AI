import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const companiesTable = pgTable("companies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  razaoSocial: text("razao_social").notNull(),
  nomeFantasia: text("nome_fantasia"),
  cnpj: text("cnpj").notNull(),
  responsavel: text("responsavel"),
  phone: text("phone"),
  email: text("email").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: real("total_spent").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCompanySchema = createInsertSchema(companiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companiesTable.$inferSelect;
