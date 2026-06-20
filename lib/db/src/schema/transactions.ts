import { pgTable, text, serial, timestamp, integer, real, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { walletsTable } from "./wallets";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "credito",
  "debito",
  "comissao",
  "saque",
  "assinatura",
  "reembolso",
  "bonus",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pendente",
  "concluida",
  "cancelada",
  "falhou",
]);

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull().references(() => walletsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").notNull().default("pendente"),
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  reference: text("reference"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_transactions_wallet_id").on(t.walletId),
  index("idx_transactions_user_id").on(t.userId),
  index("idx_transactions_status").on(t.status),
  index("idx_transactions_created_at").on(t.createdAt),
  index("idx_transactions_type").on(t.type),
]);

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
