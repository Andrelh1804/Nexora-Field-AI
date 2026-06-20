import { Router, type Response } from "express";
import { db, companiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/companies", async (req, res) => {
  try {
    const companies = await db.select().from(companiesTable);
    res.json(companies);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [company] = await db.select().from(companiesTable).where(eq(companiesTable.userId, req.userId!)).limit(1);
    if (!company) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(company);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/companies/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { razaoSocial, nomeFantasia, cnpj, responsavel, phone, email, address, city, state } = req.body;
    const [existing] = await db.select().from(companiesTable).where(eq(companiesTable.userId, req.userId!)).limit(1);
    let company;
    if (existing) {
      [company] = await db.update(companiesTable)
        .set({ razaoSocial, nomeFantasia, cnpj, responsavel, phone, email, address, city, state })
        .where(eq(companiesTable.userId, req.userId!))
        .returning();
    } else {
      [company] = await db.insert(companiesTable)
        .values({ userId: req.userId!, razaoSocial, nomeFantasia, cnpj: cnpj || "00.000.000/0001-00", responsavel, phone, email: email || "", address, city, state })
        .returning();
    }
    res.json(company);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"] as string);
    const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, id)).limit(1);
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json(company);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
