import { Router, type Response } from "express";
import { db, usersTable, techniciansTable, companiesTable, serviceOrdersTable, applicationsTable } from "@workspace/db";
import { eq, count, sum, avg } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard/admin", requireAuth, requireRole("admin"), async (req: AuthRequest, res: Response) => {
  try {
    const [techCount] = await db.select({ count: count() }).from(techniciansTable);
    const [companyCount] = await db.select({ count: count() }).from(companiesTable);
    const [orderCount] = await db.select({ count: count() }).from(serviceOrdersTable);
    const [revenueResult] = await db.select({ total: sum(serviceOrdersTable.value) }).from(serviceOrdersTable);

    const statusRows = await db.execute(sql`
      SELECT status, COUNT(*)::int as count FROM service_orders GROUP BY status
    `);
    const categoryRows = await db.execute(sql`
      SELECT category, COUNT(*)::int as count FROM service_orders GROUP BY category
    `);
    const recentOrders = await db.select().from(serviceOrdersTable)
      .orderBy(sql`${serviceOrdersTable.createdAt} DESC`).limit(5);

    res.json({
      totalTechnicians: techCount.count,
      totalCompanies: companyCount.count,
      totalServiceOrders: orderCount.count,
      revenueSimulated: parseFloat(revenueResult.total?.toString() || "0"),
      ordersByStatus: statusRows.rows.map((r: any) => ({ status: r.status, count: r.count })),
      ordersByCategory: categoryRows.rows.map((r: any) => ({ category: r.category, count: r.count })),
      recentOrders,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/company", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [company] = await db.select().from(companiesTable).where(eq(companiesTable.userId, req.userId!)).limit(1);
    if (!company) {
      res.json({ activeOrders: 0, finishedOrders: 0, totalSpent: 0, technicianCount: 0, recentOrders: [], ordersByStatus: [] });
      return;
    }
    const allOrders = await db.select().from(serviceOrdersTable).where(eq(serviceOrdersTable.companyId, company.id));
    const activeStatuses = ["aberto", "aceito", "em_andamento"];
    const active = allOrders.filter(o => activeStatuses.includes(o.status)).length;
    const finished = allOrders.filter(o => o.status === "finalizado").length;
    const spent = allOrders.filter(o => o.status === "finalizado").reduce((sum, o) => sum + (o.value || 0), 0);
    const techIds = new Set(allOrders.filter(o => o.assignedTechnicianId).map(o => o.assignedTechnicianId));
    const statusMap: Record<string, number> = {};
    for (const o of allOrders) { statusMap[o.status] = (statusMap[o.status] || 0) + 1; }
    const recent = [...allOrders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
    res.json({
      activeOrders: active,
      finishedOrders: finished,
      totalSpent: spent,
      technicianCount: techIds.size,
      recentOrders: recent,
      ordersByStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/technician", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.userId, req.userId!)).limit(1);
    if (!tech) {
      res.json({ availableOrders: 0, acceptedOrders: 0, completedOrders: 0, totalEarnings: 0, rating: null, recentApplications: [] });
      return;
    }
    const [openCount] = await db.select({ count: count() }).from(serviceOrdersTable).where(eq(serviceOrdersTable.status, "aberto"));
    const myApps = await db.select().from(applicationsTable).where(eq(applicationsTable.technicianId, tech.id));
    const accepted = myApps.filter(a => a.status === "accepted").length;
    const allOrders = await db.select().from(serviceOrdersTable).where(eq(serviceOrdersTable.assignedTechnicianId, tech.id));
    const completed = allOrders.filter(o => o.status === "finalizado").length;
    const earnings = allOrders.filter(o => o.status === "finalizado").reduce((sum, o) => sum + (o.value || 0), 0);
    const recentApps = myApps.slice(-5).reverse();
    res.json({
      availableOrders: openCount.count,
      acceptedOrders: accepted,
      completedOrders: completed,
      totalEarnings: earnings,
      rating: tech.rating,
      recentApplications: recentApps,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
