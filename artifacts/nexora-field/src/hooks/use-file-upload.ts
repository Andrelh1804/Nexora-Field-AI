import { useState, useCallback } from "react";

interface FileUploadResult {
  objectKey: string;
  fileName: string;
  mimeType: string;
}

interface UseFileUploadOptions {
  onSuccess?: (result: FileUploadResult) => void;
  onError?: (error: Error) => void;
  maxSizeMb?: number;
  accept?: string[];
}

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("nexora_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File): Promise<FileUploadResult | null> => {
      const maxBytes = (options.maxSizeMb ?? 10) * 1024 * 1024;
      if (file.size > maxBytes) {
        const msg = `Arquivo muito grande. Máximo ${options.maxSizeMb ?? 10} MB.`;
        setError(msg);
        options.onError?.(new Error(msg));
        return null;
      }

      setIsUploading(true);
      setError(null);
      setProgress(10);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API}/uploads`, {
          method: "POST",
          headers: getAuthHeader(),
          body: formData,
        });

        setProgress(80);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Falha no upload");
        }

        const data = await res.json() as { objectKey: string; fileName: string; mimeType: string };
        setProgress(100);

        const result: FileUploadResult = {
          objectKey: data.objectKey,
          fileName: data.fileName,
          mimeType: data.mimeType,
        };
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro no upload";
        setError(msg);
        options.onError?.(err instanceof Error ? err : new Error(msg));
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [options]
  );

  return { uploadFile, isUploading, progress, error };
}

export function getFileServeUrl(objectKey: string): string {
  const clean = objectKey.replace(/^\/objects\//, "");
  return `${API}/uploads/serve?key=${encodeURIComponent(clean)}`;
}

export function isObjectKey(value: string): boolean {
  return value.startsWith("uploads/") || value.startsWith("/objects/");
}
