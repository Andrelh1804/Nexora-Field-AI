import { pgTable, text, serial, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const tenantsTable = pgTable("tenants", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  domain: text("domain"),
  subdomain: text("subdomain").unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tenantBrandingTable = pgTable("tenant_branding", {
  id: serial("id").primaryKey(),
  tenantId: serial("tenant_id").notNull().references(() => tenantsTable.id, { onDelete: "cascade" }),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull().default("#2563eb"),
  secondaryColor: text("secondary_color").notNull().default("#16a34a"),
  accentColor: text("accent_color").notNull().default("#7c3aed"),
  appName: text("app_name").notNull(),
  tagline: text("tagline"),
  supportEmail: text("support_email"),
  customCss: text("custom_css"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTenantSchema = createInsertSchema(tenantsTable).omit({ id: true, createdAt: true });
export const insertTenantBrandingSchema = createInsertSchema(tenantBrandingTable).omit({ id: true, updatedAt: true });

export type Tenant = typeof tenantsTable.$inferSelect;
export type TenantBranding = typeof tenantBrandingTable.$inferSelect;
