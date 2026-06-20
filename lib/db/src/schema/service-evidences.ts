import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { serviceOrdersTable } from "./service-orders";
import { techniciansTable } from "./technicians";

export const evidenceCategoryEnum = pgEnum("evidence_category", ["antes", "durante", "depois"]);
export const evidenceTypeEnum = pgEnum("evidence_type", ["foto", "video", "documento"]);

export const serviceEvidencesTable = pgTable("service_evidences", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrdersTable.id, { onDelete: "cascade" }),
  technicianId: integer("technician_id").notNull().references(() => techniciansTable.id, { onDelete: "cascade" }),
  category: evidenceCategoryEnum("category").notNull(),
  type: evidenceTypeEnum("type").notNull().default("foto"),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertServiceEvidenceSchema = createInsertSchema(serviceEvidencesTable).omit({ id: true, createdAt: true });
export type InsertServiceEvidence = z.infer<typeof insertServiceEvidenceSchema>;
export type ServiceEvidence = typeof serviceEvidencesTable.$inferSelect;
