import { pgTable, text, serial, timestamp, boolean, integer, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// === CATEGORIES ===
export const specialtyCategoriesTable = pgTable("specialty_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull().default("🔧"),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSpecialtyCategorySchema = createInsertSchema(specialtyCategoriesTable).omit({ id: true, createdAt: true });
export type InsertSpecialtyCategory = z.infer<typeof insertSpecialtyCategorySchema>;
export type SpecialtyCategory = typeof specialtyCategoriesTable.$inferSelect;

// === SUBCATEGORIES ===
export const specialtySubcategoriesTable = pgTable("specialty_subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => specialtyCategoriesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_spec_subcats_category_id").on(t.categoryId),
  unique("uq_spec_subcats_name_category").on(t.categoryId, t.name),
]);

export const insertSpecialtySubcategorySchema = createInsertSchema(specialtySubcategoriesTable).omit({ id: true, createdAt: true });
export type InsertSpecialtySubcategory = z.infer<typeof insertSpecialtySubcategorySchema>;
export type SpecialtySubcategory = typeof specialtySubcategoriesTable.$inferSelect;

// === SKILLS ===
export const specialtySkillsTable = pgTable("specialty_skills", {
  id: serial("id").primaryKey(),
  subcategoryId: integer("subcategory_id").notNull().references(() => specialtySubcategoriesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_spec_skills_subcategory_id").on(t.subcategoryId),
  unique("uq_spec_skills_name_subcat").on(t.subcategoryId, t.name),
]);

export const insertSpecialtySkillSchema = createInsertSchema(specialtySkillsTable).omit({ id: true, createdAt: true });
export type InsertSpecialtySkill = z.infer<typeof insertSpecialtySkillSchema>;
export type SpecialtySkill = typeof specialtySkillsTable.$inferSelect;
