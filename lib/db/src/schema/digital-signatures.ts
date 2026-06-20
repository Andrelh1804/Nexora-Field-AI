import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { serviceOrdersTable } from "./service-orders";
import { createInsertSchema } from "drizzle-zod";

export const signatureStatusEnum = pgEnum("signature_status", ["pending", "signed", "rejected"]);

export const digitalSignaturesTable = pgTable("digital_signatures", {
  id: serial("id").primaryKey(),
  serviceOrderId: integer("service_order_id").notNull().references(() => serviceOrdersTable.id, { onDelete: "cascade" }),
  signerId: integer("signer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  signerRole: text("signer_role").notNull(),
  status: signatureStatusEnum("status").notNull().default("pending"),
  signedAt: timestamp("signed_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  hash: text("hash"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDigitalSignatureSchema = createInsertSchema(digitalSignaturesTable).omit({ id: true, createdAt: true, signedAt: true });
export type DigitalSignature = typeof digitalSignaturesTable.$inferSelect;
