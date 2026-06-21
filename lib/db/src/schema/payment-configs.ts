import { pgTable, text, serial, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentGatewayEnum = pgEnum("payment_gateway", [
  "mercado_pago",
  "stripe",
  "pix_manual",
  "pagseguro",
  "asaas",
]);

export const paymentConfigsTable = pgTable("payment_configs", {
  id: serial("id").primaryKey(),
  gateway: paymentGatewayEnum("gateway").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  displayName: text("display_name").notNull(),
  publicKey: text("public_key"),
  secretKey: text("secret_key"),
  webhookSecret: text("webhook_secret"),
  accessToken: text("access_token"),
  sandboxMode: boolean("sandbox_mode").notNull().default(true),
  pixKey: text("pix_key"),
  pixKeyType: text("pix_key_type"),
  pixBeneficiaryName: text("pix_beneficiary_name"),
  pixBeneficiaryCity: text("pix_beneficiary_city"),
  extraConfig: text("extra_config"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPaymentConfigSchema = createInsertSchema(paymentConfigsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPaymentConfig = z.infer<typeof insertPaymentConfigSchema>;
export type PaymentConfig = typeof paymentConfigsTable.$inferSelect;
