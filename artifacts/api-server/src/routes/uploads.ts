import { Router, type Response } from "express";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { getUploadUrl, isStorageConfigured } from "../lib/storage";

const router = Router();

router.post("/uploads/request-url", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!isStorageConfigured()) {
      res.status(503).json({ error: "Storage não configurado.", fallback: true });
      return;
    }
    const { mimeType = "application/octet-stream" } = req.body as { mimeType?: string };
    const { uploadUrl, objectPath } = await getUploadUrl(mimeType);
    res.json({ uploadUrl, objectPath });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Erro ao gerar URL de upload." });
  }
});

export default router;
