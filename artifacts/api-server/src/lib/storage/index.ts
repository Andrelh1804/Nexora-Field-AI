import { randomUUID } from "crypto";

const REPLIT_SIDECAR = "http://127.0.0.1:1106";
const PRIVATE_DIR = process.env.PRIVATE_OBJECT_DIR ?? "";

export function isStorageConfigured(): boolean {
  return !!PRIVATE_DIR;
}

export async function getUploadUrl(mimeType: string): Promise<{ uploadUrl: string; objectPath: string }> {
  if (!PRIVATE_DIR) throw new Error("Object Storage não configurado.");

  const objectId = randomUUID();
  const fullPath = `${PRIVATE_DIR}/uploads/${objectId}`;
  const parts = fullPath.replace(/^\//, "").split("/");
  const bucketName = parts[0];
  const objectName = parts.slice(1).join("/");

  const resp = await fetch(`${REPLIT_SIDECAR}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method: "PUT",
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    }),
  });

  if (!resp.ok) throw new Error(`Sidecar error: ${resp.status}`);
  const { signed_url } = await resp.json() as { signed_url: string };

  const objectPath = `/objects/uploads/${objectId}`;
  return { uploadUrl: signed_url, objectPath };
}

export async function getDownloadUrl(objectPath: string): Promise<string> {
  if (!PRIVATE_DIR) return objectPath;

  const fullPath = `${PRIVATE_DIR}${objectPath.replace("/objects", "")}`;
  const parts = fullPath.replace(/^\//, "").split("/");
  const bucketName = parts[0];
  const objectName = parts.slice(1).join("/");

  const resp = await fetch(`${REPLIT_SIDECAR}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method: "GET",
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }),
  });

  if (!resp.ok) return objectPath;
  const { signed_url } = await resp.json() as { signed_url: string };
  return signed_url;
}

export async function checkStorageHealth(): Promise<{ ok: boolean; configured: boolean }> {
  if (!PRIVATE_DIR) return { ok: false, configured: false };
  try {
    // Validate by attempting to generate a signed URL for a dummy object
    const parts = `${PRIVATE_DIR}/health-check`.replace(/^\//, "").split("/");
    const resp = await fetch(`${REPLIT_SIDECAR}/object-storage/signed-object-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket_name: parts[0],
        object_name: parts.slice(1).join("/"),
        method: "GET",
        expires_at: new Date(Date.now() + 60000).toISOString(),
      }),
      signal: AbortSignal.timeout(3000),
    });
    return { ok: resp.ok, configured: true };
  } catch {
    return { ok: false, configured: true };
  }
}
