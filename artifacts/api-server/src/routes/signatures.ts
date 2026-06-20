import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { db } from "@workspace/db";
import { digitalSignaturesTable, serviceOrdersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

router.get("/service-orders/:id", requireAuth, async (req, res) => {
  const orderId = Number(req.params["id"]);
  const sigs = await db.select().from(digitalSignaturesTable).where(eq(digitalSignaturesTable.serviceOrderId, orderId));
  res.json(sigs);
});

router.post("/service-orders/:id/sign", requireAuth, async (req, res) => {
  const orderId = Number(req.params["id"]);
  const { notes } = req.body;

  const [existing] = await db.select().from(digitalSignaturesTable)
    .where(and(
      eq(digitalSignaturesTable.serviceOrderId, orderId),
      eq(digitalSignaturesTable.signerId, req.user!.id)
    ));

  const hash = crypto.createHash("sha256")
    .update(`${orderId}-${req.user!.id}-${Date.now()}`)
    .digest("hex");

  if (existing) {
    const [sig] = await db.update(digitalSignaturesTable)
      .set({ status: "signed", signedAt: new Date(), hash, notes: notes || existing.notes, ipAddress: req.ip })
      .where(eq(digitalSignaturesTable.id, existing.id))
      .returning();
    res.json(sig);
    return;
  }

  const [sig] = await db.insert(digitalSignaturesTable).values({
    serviceOrderId: orderId,
    signerId: req.user!.id,
    signerRole: req.user!.role,
    status: "signed",
    signedAt: new Date(),
    hash,
    notes: notes || null,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || null,
  }).returning();

  res.json(sig);
});

export default router;
