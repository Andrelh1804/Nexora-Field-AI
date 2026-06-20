import { pgTable, serial, timestamp, integer, pgEnum, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { techniciansTable } from "./technicians";
import { specialtySkillsTable } from "./specialty-categories";

export const specialtyLevelEnum = pgEnum("specialty_level", [
  "iniciante",
  "intermediario",
  "avancado",
  "especialista",
]);

export const technicianSpecialtiesTable = pgTable("technician_specialties", {
  id: serial("id").primaryKey(),
  technicianId: integer("technician_id").notNull().references(() => techniciansTable.id, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => specialtySkillsTable.id, { onDelete: "cascade" }),
  level: specialtyLevelEnum("level").notNull().default("iniciante"),
  yearsExperience: integer("years_experience").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => [
  index("idx_tech_spec_technician_id").on(t.technicianId),
  index("idx_tech_spec_skill_id").on(t.skillId),
  unique("uq_tech_spec_tech_skill").on(t.technicianId, t.skillId),
]);

export const insertTechnicianSpecialtySchema = createInsertSchema(technicianSpecialtiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTechnicianSpecialty = z.infer<typeof insertTechnicianSpecialtySchema>;
export type TechnicianSpecialty = typeof technicianSpecialtiesTable.$inferSelect;
