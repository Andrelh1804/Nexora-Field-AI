import { Router, type Response } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { db } from "@workspace/db";
import { tenantsTable, tenantBrandingTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.slug, "nexora")).limit(1);
  if (!tenant) {
    res.json({
      id: 1,
      slug: "nexora",
      name: "Nexora Field AI",
      domain: null,
      subdomain: null,
      active: true,
      branding: {
        logoUrl: "/nexora-logo.png",
        primaryColor: "#2563eb",
        secondaryColor: "#16a34a",
        accentColor: "#7c3aed",
        appName: "Nexora Field AI",
        tagline: "Intelligent Field Services",
        supportEmail: "suporte@nexora.ai",
        customCss: null,
      },
    });
    return;
  }

  const [branding] = await db.select().from(tenantBrandingTable).where(eq(tenantBrandingTable.tenantId, tenant.id)).limit(1);
  res.json({ ...tenant, branding: branding || null });
});

router.put("/branding", requireAuth, requireRole("admin"), async (req, res) => {
  const { appName, primaryColor, secondaryColor, accentColor, tagline, supportEmail, logoUrl, customCss } = req.body;

  let [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.slug, "nexora")).limit(1);
  if (!tenant) {
    [tenant] = await db.insert(tenantsTable).values({ slug: "nexora", name: appName || "Nexora Field AI" }).returning();
  }

  const existing = await db.select().from(tenantBrandingTable).where(eq(tenantBrandingTable.tenantId, tenant.id));

  let branding;
  if (existing.length > 0) {
    [branding] = await db.update(tenantBrandingTable)
      .set({ appName, primaryColor, secondaryColor, accentColor, tagline, supportEmail, logoUrl, customCss, updatedAt: new Date() })
      .where(eq(tenantBrandingTable.tenantId, tenant.id))
      .returning();
  } else {
    [branding] = await db.insert(tenantBrandingTable).values({
      tenantId: tenant.id,
      appName: appName || "Nexora Field AI",
      primaryColor: primaryColor || "#2563eb",
      secondaryColor: secondaryColor || "#16a34a",
      accentColor: accentColor || "#7c3aed",
      tagline, supportEmail, logoUrl, customCss,
    }).returning();
  }

  res.json({ ...tenant, branding });
});

export default router;
