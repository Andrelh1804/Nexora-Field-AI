import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const landingSettingsTable = pgTable("landing_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const landingTestimonialsTable = pgTable("landing_testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  company: text("company"),
  content: text("content").notNull(),
  avatar: text("avatar"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const landingFaqTable = pgTable("landing_faq", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const landingBenefitsTable = pgTable("landing_benefits", {
  id: serial("id").primaryKey(),
  icon: text("icon").notNull().default("✅"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLandingTestimonialSchema = createInsertSchema(landingTestimonialsTable).omit({ id: true, createdAt: true });
export const insertLandingFaqSchema = createInsertSchema(landingFaqTable).omit({ id: true, createdAt: true });
export const insertLandingBenefitSchema = createInsertSchema(landingBenefitsTable).omit({ id: true, createdAt: true });

export type LandingSetting = typeof landingSettingsTable.$inferSelect;
export type LandingTestimonial = typeof landingTestimonialsTable.$inferSelect;
export type LandingFaq = typeof landingFaqTable.$inferSelect;
export type LandingBenefit = typeof landingBenefitsTable.$inferSelect;
