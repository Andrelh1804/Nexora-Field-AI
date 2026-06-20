import { pgTable, text, serial, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const auditActionEnum = pgEnum("audit_action", [
  "login", "logout", "register",
  "create", "update", "delete", "view",
  "payment", "subscription", "withdrawal",
  "checkin", "checkout", "apply", "accept", "reject",
  "evidence_upload", "signature",
]);

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  action: auditActionEnum("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
