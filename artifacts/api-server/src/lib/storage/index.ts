import { Client } from "@replit/object-storage";
import { randomUUID } from "crypto";

let _client: Client | null = null;
let _checked = false;
let _available = false;

async function getClient(): Promise<Client | null> {
  if (_checked) return _available ? _client : null;
  _checked = true;
  try {
    const c = new Client();
    await c.init();
    _client = c;
    _available = true;
    return c;
  } catch {
    _available = false;
    return null;
  }
}

export function isStorageConfigured(): boolean {
  return _available;
}

export async function checkStorageAvailable(): Promise<boolean> {
  await getClient();
  return _available;
}

export async function uploadFile(
  buffer: Buffer,
  mimeType: string,
  prefix = "uploads"
): Promise<string> {
  const client = await getClient();
  if (!client) throw new Error("Object Storage não configurado. Ative o App Storage nas configurações do Replit.");
  const key = `${prefix}/${randomUUID()}`;
  const result = await client.uploadFromBytes(key, buffer, { contentType: mimeType });
  if (!result.ok) throw new Error(result.error?.message ?? "Falha no upload");
  return key;
}

export async function downloadFile(key: string): Promise<Buffer> {
  const client = await getClient();
  if (!client) throw new Error("Object Storage não configurado.");
  const clean = key.replace(/^\/objects\//, "");
  const result = await client.downloadAsBytes(clean);
  if (!result.ok) throw new Error(result.error?.message ?? "Arquivo não encontrado");
  return Buffer.from(result.value!);
}

export async function deleteFile(key: string): Promise<void> {
  const client = await getClient();
  if (!client) return;
  const clean = key.replace(/^\/objects\//, "");
  await client.delete(clean);
}

export async function fileExists(key: string): Promise<boolean> {
  const client = await getClient();
  if (!client) return false;
  const clean = key.replace(/^\/objects\//, "");
  const result = await client.exists(clean);
  return result.ok ? (result.value ?? false) : false;
}

export async function checkStorageHealth(): Promise<{ ok: boolean; configured: boolean }> {
  await getClient();
  return { ok: _available, configured: _available };
}

export function objectKeyToPath(key: string): string {
  if (key.startsWith("/objects/")) return key;
  return `/objects/${key}`;
}

export function pathToObjectKey(path: string): string {
  return path.replace(/^\/objects\//, "");
}
