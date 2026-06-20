import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { serviceOrdersTable } from "./service-orders";
import { techniciansTable } from "./technicians";
import { companiesTable } from "./companies";

export const ratingsTable = pgTable("ratings", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrdersTable.id, { onDelete: "cascade" }),
  technicianId: integer("technician_id").notNull().references(() => techniciansTable.id, { onDelete: "cascade" }),
  companyId: integer("company_id").notNull().references(() => companiesTable.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRatingSchema = createInsertSchema(ratingsTable).omit({ id: true, createdAt: true });
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratingsTable.$inferSelect;
