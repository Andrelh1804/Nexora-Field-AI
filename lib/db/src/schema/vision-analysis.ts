import { pgTable, text, serial, timestamp, integer, jsonb, pgEnum, real } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { serviceOrdersTable } from "./service-orders";
import { createInsertSchema } from "drizzle-zod";

export const criticalityEnum = pgEnum("criticality_level", ["baixa", "media", "alta", "critica"]);

export const visionAnalysisTable = pgTable("vision_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  serviceOrderId: integer("service_order_id").references(() => serviceOrdersTable.id, { onDelete: "set null" }),
  imageUrl: text("image_url").notNull(),
  equipmentDetected: text("equipment_detected"),
  manufacturer: text("manufacturer"),
  model: text("model"),
  defectsFound: text("defects_found").array().notNull().default([]),
  criticality: criticalityEnum("criticality"),
  confidence: real("confidence"),
  diagnosis: text("diagnosis"),
  recommendations: text("recommendations").array().notNull().default([]),
  stepByStep: text("step_by_step").array().notNull().default([]),
  rawResponse: jsonb("raw_response"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVisionAnalysisSchema = createInsertSchema(visionAnalysisTable).omit({ id: true, createdAt: true });
export type VisionAnalysis = typeof visionAnalysisTable.$inferSelect;
