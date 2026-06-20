import { Router, type Response } from "express";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import { db } from "@workspace/db";
import { auditLogsTable, usersTable } from "@workspace/db";
import { desc, eq, and, gte } from "drizzle-orm";

const router = Router();

router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  const { limit = "50", offset = "0", userId, action, days } = req.query as Record<string, string>;

  let query = db.select({
    log: auditLogsTable,
    user: { name: usersTable.name, email: usersTable.email, role: usersTable.role },
  })
    .from(auditLogsTable)
    .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
    .$dynamic();

  if (userId) query = query.where(eq(auditLogsTable.userId, Number(userId)));
  if (action) query = query.where(eq(auditLogsTable.action, action as any));
  if (days) {
    const since = new Date(Date.now() - Number(days) * 86400000);
    query = query.where(gte(auditLogsTable.createdAt, since));
  }

  const logs = await query
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(Number(limit))
    .offset(Number(offset));

  res.json(logs);
});

export default router;

export async function logAudit(params: {
  userId?: number;
  action: typeof auditLogsTable.$inferInsert["action"];
  resource: string;
  resourceId?: string;
  details?: any;
  ip?: string;
  ua?: string;
}) {
  try {
    await db.insert(auditLogsTable).values({
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      ipAddress: params.ip,
      userAgent: params.ua,
    });
  } catch { /* non-blocking */ }
}
