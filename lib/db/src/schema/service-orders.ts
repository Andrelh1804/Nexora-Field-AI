import { pgTable, text, serial, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { techniciansTable } from "./technicians";

export const categoryEnum = pgEnum("service_category", [
  "fibra_optica",
  "redes",
  "infraestrutura",
  "automacao_industrial",
  "cftv",
  "telecom",
]);

export const statusEnum = pgEnum("service_status", [
  "aberto",
  "aceito",
  "em_andamento",
  "finalizado",
  "cancelado",
]);

export const serviceOrdersTable = pgTable("service_orders", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  assignedTechnicianId: integer("assigned_technician_id").references(() => techniciansTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: categoryEnum("category").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  address: text("address"),
  value: real("value"),
  sla: text("sla"),
  status: statusEnum("status").notNull().default("aberto"),
  observations: text("observations"),
  applicationsCount: integer("applications_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertServiceOrderSchema = createInsertSchema(serviceOrdersTable).omit({ id: true, createdAt: true, updatedAt: true, applicationsCount: true });
export type InsertServiceOrder = z.infer<typeof insertServiceOrderSchema>;
export type ServiceOrder = typeof serviceOrdersTable.$inferSelect;
