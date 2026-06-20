import { Router, type Response } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { db } from "@workspace/db";
import { contractsTable, companiesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/contracts", requireAuth, async (req: AuthRequest, res: Response) => {
  const isAdmin = req.userRole! === "admin";
  let query = db.select({ contract: contractsTable, company: { name: companiesTable.razaoSocial } })
    .from(contractsTable)
    .leftJoin(companiesTable, eq(contractsTable.companyId, companiesTable.id))
    .$dynamic();
  if (!isAdmin) {
    const [co] = await db.select().from(companiesTable).where(eq(companiesTable.userId, req.userId!));
    if (!co) { res.json([]); return; }
    query = query.where(eq(contractsTable.companyId, co.id));
  }
  const contracts = await query.orderBy(desc(contractsTable.createdAt)).limit(50);
  res.json(contracts);
});

router.post("/contracts", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const { companyId, title, value, monthlyValue, maxOrdersPerMonth, slaHours, startDate, endDate, autoRenew, notes } = req.body;
  const number = `NXR-${Date.now().toString(36).toUpperCase()}`;
  const [contract] = await db.insert(contractsTable).values({
    companyId, title, number, value, monthlyValue, maxOrdersPerMonth, slaHours: slaHours || 24,
    startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : undefined,
    autoRenew: autoRenew || false, notes, signedById: req.userId!, signedAt: new Date(), status: "ativo",
  }).returning();
  res.json(contract);
});

router.put("/contracts/:id", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  const [contract] = await db.update(contractsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(contractsTable.id, Number(req.params["id"]))).returning();
  res.json(contract);
});

export default router;
