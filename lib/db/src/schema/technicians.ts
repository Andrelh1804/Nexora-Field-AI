import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const techniciansTable = pgTable("technicians", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  cpf: text("cpf"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  specialties: text("specialties").array().notNull().default([]),
  rating: real("rating"),
  totalServices: integer("total_services").notNull().default(0),
  totalEarnings: real("total_earnings").default(0),
  latitude: real("latitude"),
  longitude: real("longitude"),
  serviceRadius: integer("service_radius").default(100),
  availableDays: text("available_days").array().default([]),
  availableFrom: text("available_from"),
  availableTo: text("available_to"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTechnicianSchema = createInsertSchema(techniciansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type Technician = typeof techniciansTable.$inferSelect;
