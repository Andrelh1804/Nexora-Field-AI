import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { serviceOrdersTable } from "./service-orders";
import { techniciansTable } from "./technicians";

export const checkinCheckoutsTable = pgTable("checkin_checkouts", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrdersTable.id, { onDelete: "cascade" }),
  technicianId: integer("technician_id").notNull().references(() => techniciansTable.id, { onDelete: "cascade" }),
  checkinAt: timestamp("checkin_at", { withTimezone: true }),
  checkinLatitude: real("checkin_latitude"),
  checkinLongitude: real("checkin_longitude"),
  checkinPhotoUrl: text("checkin_photo_url"),
  checkoutAt: timestamp("checkout_at", { withTimezone: true }),
  checkoutLatitude: real("checkout_latitude"),
  checkoutLongitude: real("checkout_longitude"),
  checkoutPhotoUrl: text("checkout_photo_url"),
  durationMinutes: integer("duration_minutes"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCheckinCheckoutSchema = createInsertSchema(checkinCheckoutsTable).omit({ id: true, createdAt: true });
export type InsertCheckinCheckout = z.infer<typeof insertCheckinCheckoutSchema>;
export type CheckinCheckout = typeof checkinCheckoutsTable.$inferSelect;
