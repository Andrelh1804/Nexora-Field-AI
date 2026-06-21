import { Router, type Response, type Request } from "express";
import multer from "multer";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { uploadFile, downloadFile, isStorageConfigured, checkStorageAvailable } from "../lib/storage";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/octet-stream",
]);

router.post("/uploads", requireAuth, upload.single("file"), async (req: AuthRequest, res: Response) => {
  try {
    const available = await checkStorageAvailable();
    if (!available) {
      res.status(503).json({
        error: "Object Storage não configurado. Acesse as configurações do Replit e ative o App Storage.",
        configured: false,
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "Nenhum arquivo enviado." });
      return;
    }

    const mimeType = req.file.mimetype || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      res.status(400).json({ error: `Tipo de arquivo não permitido: ${mimeType}` });
      return;
    }

    const objectKey = await uploadFile(req.file.buffer, mimeType);

    res.json({
      objectKey,
      fileName: req.file.originalname,
      mimeType,
      size: req.file.size,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Erro no upload." });
  }
});

router.get("/uploads/serve", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const key = req.query["key"] as string;
    if (!key || typeof key !== "string") {
      res.status(400).json({ error: "Parâmetro 'key' obrigatório." });
      return;
    }

    const available = await checkStorageAvailable();
    if (!available) {
      res.status(503).json({ error: "Object Storage não configurado." });
      return;
    }

    const buffer = await downloadFile(key);

    const ext = key.split(".").pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    const contentType = ext ? (mimeMap[ext] ?? "application/octet-stream") : "application/octet-stream";

    res.set({
      "Content-Type": contentType,
      "Content-Length": buffer.length,
      "Cache-Control": "private, max-age=3600",
    });
    res.send(buffer);
  } catch (err: any) {
    res.status(404).json({ error: err?.message ?? "Arquivo não encontrado." });
  }
});

router.post("/uploads/request-url", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const available = await checkStorageAvailable();
    if (!available) {
      res.status(503).json({ error: "Storage não configurado.", fallback: true, configured: false });
      return;
    }
    res.status(501).json({
      error: "Use POST /api/uploads para upload direto (multipart/form-data).",
      useDirectUpload: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Erro." });
  }
});

export default router;
