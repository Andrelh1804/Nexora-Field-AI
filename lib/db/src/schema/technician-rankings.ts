import { pgTable, serial, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { techniciansTable } from "./technicians";

export const rankingLevelEnum = pgEnum("ranking_level", [
  "bronze",
  "prata",
  "ouro",
  "platina",
  "diamante",
]);

export const technicianRankingsTable = pgTable("technician_rankings", {
  id: serial("id").primaryKey(),
  technicianId: integer("technician_id").notNull().references(() => techniciansTable.id, { onDelete: "cascade" }).unique(),
  level: rankingLevelEnum("level").notNull().default("bronze"),
  score: real("score").notNull().default(0),
  completedOrders: integer("completed_orders").notNull().default(0),
  avgRating: real("avg_rating").default(0),
  slaCompliance: real("sla_compliance").default(0),
  academyScore: integer("academy_score").notNull().default(0),
  position: integer("position"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTechnicianRankingSchema = createInsertSchema(technicianRankingsTable).omit({ id: true, updatedAt: true });
export type InsertTechnicianRanking = z.infer<typeof insertTechnicianRankingSchema>;
export type TechnicianRanking = typeof technicianRankingsTable.$inferSelect;
