import { pgTable, serial, timestamp, integer, real, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { techniciansTable } from "./technicians";

export const locationsTable = pgTable("locations", {
  id: serial("id").primaryKey(),
  technicianId: integer("technician_id").notNull().references(() => techniciansTable.id, { onDelete: "cascade" }).unique(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  city: text("city"),
  state: text("state"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLocationSchema = createInsertSchema(locationsTable).omit({ id: true, updatedAt: true });
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locationsTable.$inferSelect;
