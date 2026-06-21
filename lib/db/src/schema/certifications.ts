import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { techniciansTable } from "./technicians";
import { usersTable } from "./users";

export const certTypeEnum = pgEnum("cert_type", [
  "nr10", "nr35", "cisco", "mikrotik", "furukawa",
  "huawei", "aws", "microsoft", "other",
]);

export const certStatusEnum = pgEnum("cert_status", [
  "pending", "approved", "rejected",
]);

export const certificationsTable = pgTable("certifications", {
  id: serial("id").primaryKey(),
  technicianId: integer("technician_id").notNull().references(() => techniciansTable.id, { onDelete: "cascade" }),
  certType: certTypeEnum("cert_type").notNull(),
  certName: text("cert_name").notNull(),
  issuedBy: text("issued_by"),
  issueDate: text("issue_date"),
  expiryDate: text("expiry_date"),
  fileData: text("file_data"),
  fileName: text("file_name"),
  fileMime: text("file_mime"),
  status: certStatusEnum("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  approvedById: integer("approved_by_id").references(() => usersTable.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCertificationSchema = createInsertSchema(certificationsTable).omit({
  id: true, createdAt: true, updatedAt: true, approvedAt: true,
});
export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type Certification = typeof certificationsTable.$inferSelect;
