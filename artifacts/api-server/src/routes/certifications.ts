import { Router, type Response } from "express";
import { db, certificationsTable, techniciansTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";

const router = Router();

const CERT_LABELS: Record<string, string> = {
  nr10: "NR-10 (Eletricidade)",
  nr35: "NR-35 (Trabalho em Altura)",
  cisco: "Cisco (CCNA/CCNP/etc)",
  mikrotik: "MikroTik (MTCNA/MTCRE/etc)",
  furukawa: "Furukawa Certified",
  huawei: "Huawei Certified",
  aws: "AWS (Cloud Practitioner/SA/etc)",
  microsoft: "Microsoft (AZ/MS/etc)",
  other: "Outra Certificação",
};

router.get(
  "/certifications/me",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const [tech] = await db
        .select()
        .from(techniciansTable)
        .where(eq(techniciansTable.userId, req.userId!))
        .limit(1);
      if (!tech) { res.status(404).json({ error: "Perfil de técnico não encontrado." }); return; }
      const certs = await db
        .select()
        .from(certificationsTable)
        .where(eq(certificationsTable.technicianId, tech.id))
        .orderBy(desc(certificationsTable.createdAt));
      res.json(certs);
    } catch {
      res.status(500).json({ error: "Erro ao buscar certificações." });
    }
  }
);

router.get(
  "/certifications/technician/:techId",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const techId = parseInt(req.params["techId"] as string);
      const certs = await db
        .select()
        .from(certificationsTable)
        .where(eq(certificationsTable.technicianId, techId))
        .orderBy(desc(certificationsTable.createdAt));
      const approved = certs.filter(c => c.status === "approved").map(c => ({
        id: c.id,
        certType: c.certType,
        certName: c.certName,
        issuedBy: c.issuedBy,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        status: c.status,
        approvedAt: c.approvedAt,
      }));
      res.json(approved);
    } catch {
      res.status(500).json({ error: "Erro ao buscar certificações." });
    }
  }
);

router.post(
  "/certifications",
  requireAuth,
  requireRole("technician"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { certType, certName, issuedBy, issueDate, expiryDate, fileData, fileName, fileMime } = req.body as {
        certType: string; certName: string; issuedBy?: string;
        issueDate?: string; expiryDate?: string;
        fileData?: string; fileName?: string; fileMime?: string;
      };

      if (!certType || !certName) {
        res.status(400).json({ error: "Tipo e nome da certificação são obrigatórios." });
        return;
      }

      const [tech] = await db
        .select()
        .from(techniciansTable)
        .where(eq(techniciansTable.userId, req.userId!))
        .limit(1);
      if (!tech) { res.status(404).json({ error: "Perfil de técnico não encontrado." }); return; }

      const [cert] = await db
        .insert(certificationsTable)
        .values({
          technicianId: tech.id,
          certType: certType as any,
          certName: certName || CERT_LABELS[certType] || certType,
          issuedBy: issuedBy || null,
          issueDate: issueDate || null,
          expiryDate: expiryDate || null,
          fileData: fileData || null,
          fileName: fileName || null,
          fileMime: fileMime || null,
          status: "pending",
        })
        .returning();

      res.status(201).json(cert);
    } catch {
      res.status(500).json({ error: "Erro ao enviar certificação." });
    }
  }
);

router.delete(
  "/certifications/:id",
  requireAuth,
  requireRole("technician"),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params["id"] as string);
      const [tech] = await db
        .select()
        .from(techniciansTable)
        .where(eq(techniciansTable.userId, req.userId!))
        .limit(1);
      if (!tech) { res.status(404).json({ error: "Perfil não encontrado." }); return; }
      await db
        .delete(certificationsTable)
        .where(eq(certificationsTable.id, id));
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Erro ao remover certificação." });
    }
  }
);

router.get(
  "/admin/certifications",
  requireAuth,
  requireRole("admin", "admin_master"),
  async (_req: AuthRequest, res: Response) => {
    try {
      const certs = await db
        .select({
          cert: certificationsTable,
          tech: {
            id: techniciansTable.id,
            name: techniciansTable.name,
            email: techniciansTable.email,
            city: techniciansTable.city,
            state: techniciansTable.state,
          },
        })
        .from(certificationsTable)
        .innerJoin(techniciansTable, eq(certificationsTable.technicianId, techniciansTable.id))
        .orderBy(desc(certificationsTable.createdAt));
      res.json(certs);
    } catch {
      res.status(500).json({ error: "Erro ao buscar certificações." });
    }
  }
);

router.put(
  "/admin/certifications/:id/review",
  requireAuth,
  requireRole("admin", "admin_master"),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params["id"] as string);
      const { status, adminNotes } = req.body as { status: "approved" | "rejected"; adminNotes?: string };

      if (!["approved", "rejected"].includes(status)) {
        res.status(400).json({ error: "Status inválido." });
        return;
      }

      const [updated] = await db
        .update(certificationsTable)
        .set({
          status,
          adminNotes: adminNotes || null,
          approvedById: status === "approved" ? req.userId! : null,
          approvedAt: status === "approved" ? new Date() : null,
        })
        .where(eq(certificationsTable.id, id))
        .returning();

      if (!updated) { res.status(404).json({ error: "Certificação não encontrada." }); return; }
      res.json(updated);
    } catch {
      res.status(500).json({ error: "Erro ao revisar certificação." });
    }
  }
);

export default router;
