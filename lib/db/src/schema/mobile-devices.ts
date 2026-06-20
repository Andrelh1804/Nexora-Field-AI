import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { createInsertSchema } from "drizzle-zod";

export const mobileDevicesTable = pgTable("mobile_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  deviceId: text("device_id").notNull(),
  pushToken: text("push_token"),
  appVersion: text("app_version"),
  active: boolean("active").notNull().default(true),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMobileDeviceSchema = createInsertSchema(mobileDevicesTable).omit({ id: true, createdAt: true, lastSeenAt: true });
export type MobileDevice = typeof mobileDevicesTable.$inferSelect;
