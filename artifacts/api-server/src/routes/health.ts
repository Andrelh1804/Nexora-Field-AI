import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { checkStorageHealth } from "../lib/storage";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/health", async (_req, res) => {
  const start = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; detail?: string }> = {};

  try {
    const t = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.database = { ok: true, latencyMs: Date.now() - t };
  } catch (err: any) {
    checks.database = { ok: false, detail: err?.message ?? "DB unreachable" };
  }

  try {
    const storage = await checkStorageHealth();
    checks.storage = {
      ok: storage.ok || !storage.configured,
      detail: !storage.configured
        ? "not configured — base64 fallback active"
        : storage.ok ? "reachable" : "sidecar unreachable",
    };
  } catch {
    checks.storage = { ok: false, detail: "error checking storage" };
  }

  checks.api = { ok: true, latencyMs: Date.now() - start };

  const allOk = Object.values(checks).every(c => c.ok);

  res.status(allOk ? 200 : 207).json({
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    node: process.version,
    checks,
  });
});

export default router;
