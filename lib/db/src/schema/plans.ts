import { pgTable, text, serial, timestamp, integer, real, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const planTargetEnum = pgEnum("plan_target", ["technician", "company", "both"]);

export const plansTable = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  target: planTargetEnum("target").notNull(),
  price: real("price").notNull().default(0),
  maxOrders: integer("max_orders"),
  features: text("features").array().notNull().default([]),
  highlighted: boolean("highlighted").notNull().default(false),
  stripePriceId: text("stripe_price_id"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlanSchema = createInsertSchema(plansTable).omit({ id: true, createdAt: true });
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type Plan = typeof plansTable.$inferSelect;
