import { Router, type Response } from "express";
import { db, walletsTable, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function getOrCreateWallet(userId: number) {
  const [existing] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(walletsTable).values({ userId }).returning();
  return created;
}

// Get my wallet
router.get("/wallet", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const wallet = await getOrCreateWallet(req.userId!);
    res.json(wallet);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get transactions
router.get("/wallet/transactions", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const wallet = await getOrCreateWallet(req.userId!);
    const txs = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.walletId, wallet.id))
      .orderBy(desc(transactionsTable.createdAt))
      .limit(50);
    res.json(txs);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Request withdrawal
router.post("/wallet/withdraw", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const wallet = await getOrCreateWallet(req.userId!);
    const { amount, pixKey } = req.body;
    if (!amount || amount < 50) {
      res.status(400).json({ error: "Valor mínimo para saque: R$ 50,00" });
      return;
    }
    if (amount > wallet.balance) {
      res.status(400).json({ error: "Saldo insuficiente" });
      return;
    }
    // Deduct from wallet
    await db.update(walletsTable)
      .set({
        balance: wallet.balance - amount,
        totalWithdrawn: wallet.totalWithdrawn + amount,
      })
      .where(eq(walletsTable.id, wallet.id));

    const [tx] = await db.insert(transactionsTable).values({
      walletId: wallet.id,
      userId: req.userId!,
      type: "saque",
      status: "pendente",
      amount: -amount,
      description: `Saque PIX — chave: ${pixKey || "não informada"}`,
    }).returning();

    res.status(201).json(tx);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: financial summary
router.get("/wallet/admin/summary", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
    const wallets = await db.select().from(walletsTable);
    const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
    const totalEarned = wallets.reduce((s, w) => s + w.totalEarned, 0);
    const totalWithdrawn = wallets.reduce((s, w) => s + w.totalWithdrawn, 0);
    res.json({ totalBalance, totalEarned, totalWithdrawn, walletCount: wallets.length });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
