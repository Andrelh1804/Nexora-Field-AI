import { pgTable, serial, timestamp, integer, text, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { serviceOrdersTable } from "./service-orders";
import { techniciansTable } from "./technicians";

export const dispatchStatusEnum = pgEnum("dispatch_status", [
  "enviado",
  "aceito",
  "recusado",
  "expirado",
]);

export const dispatchHistoryTable = pgTable("dispatch_history", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrdersTable.id, { onDelete: "cascade" }),
  technicianId: integer("technician_id").notNull().references(() => techniciansTable.id, { onDelete: "cascade" }),
  status: dispatchStatusEnum("status").notNull().default("enviado"),
  score: integer("score"),
  reason: text("reason"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

export const insertDispatchHistorySchema = createInsertSchema(dispatchHistoryTable).omit({ id: true, sentAt: true });
export type InsertDispatchHistory = z.infer<typeof insertDispatchHistorySchema>;
export type DispatchHistory = typeof dispatchHistoryTable.$inferSelect;
