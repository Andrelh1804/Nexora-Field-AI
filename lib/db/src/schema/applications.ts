import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { serviceOrdersTable } from "./service-orders";
import { techniciansTable } from "./technicians";

export const applicationStatusEnum = pgEnum("application_status", ["pending", "accepted", "rejected"]);

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrdersTable.id, { onDelete: "cascade" }),
  technicianId: integer("technician_id").notNull().references(() => techniciansTable.id, { onDelete: "cascade" }),
  status: applicationStatusEnum("status").notNull().default("pending"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
