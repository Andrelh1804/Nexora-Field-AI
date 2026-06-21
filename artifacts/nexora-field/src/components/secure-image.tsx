import { useState, useEffect, useRef } from "react";

interface SecureImageProps {
  objectKey: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
  mimeType?: string;
}

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

function getToken(): string | null {
  return localStorage.getItem("nexora_token");
}

function buildServeUrl(key: string): string {
  const clean = key.replace(/^\/objects\//, "");
  return `${API}/uploads/serve?key=${encodeURIComponent(clean)}`;
}

export function isObjectStorageKey(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith("uploads/") || value.startsWith("/objects/");
}

export function useSecureUrl(objectKey: string | null | undefined): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!objectKey || !isObjectStorageKey(objectKey)) {
      setBlobUrl(null);
      return;
    }
    const token = getToken();
    if (!token) { setBlobUrl(null); return; }

    let cancelled = false;
    const url = buildServeUrl(objectKey);

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error("Not found");
        return r.blob();
      })
      .then(blob => {
        if (cancelled) return;
        if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
        const burl = URL.createObjectURL(blob);
        prevUrl.current = burl;
        setBlobUrl(burl);
      })
      .catch(() => {
        if (!cancelled) setBlobUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [objectKey]);

  useEffect(() => {
    return () => {
      if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
    };
  }, []);

  return blobUrl;
}

export function SecureImage({ objectKey, alt = "", className, fallback }: SecureImageProps) {
  const blobUrl = useSecureUrl(objectKey);

  if (!blobUrl) {
    return <>{fallback ?? null}</>;
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}

export function SecurePdfViewer({ objectKey, className }: { objectKey: string; className?: string }) {
  const blobUrl = useSecureUrl(objectKey);

  if (!blobUrl) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }

  return (
    <iframe
      src={blobUrl}
      className={className}
      title="Documento PDF"
    />
  );
}

export function SecureFilePreview({ objectKey, mimeType, fileName, className }: {
  objectKey: string;
  mimeType?: string;
  fileName?: string;
  className?: string;
}) {
  const blobUrl = useSecureUrl(objectKey);

  if (!blobUrl) {
    return (
      <div className="flex items-center justify-center h-40 bg-muted/20 rounded-lg text-muted-foreground text-sm">
        Carregando arquivo...
      </div>
    );
  }

  const isImage = mimeType?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName ?? "");

  if (isImage) {
    return <img src={blobUrl} alt={fileName ?? "Arquivo"} className={className ?? "max-w-full mx-auto rounded-lg"} />;
  }

  return (
    <iframe
      src={blobUrl}
      className={className ?? "w-full h-[70vh] rounded-lg"}
      title={fileName ?? "Documento"}
    />
  );
}
