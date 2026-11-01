import { del } from "@vercel/blob";
import { cleanEnv } from "@/lib/env";

export function getCleanBlobToken(): string {
  return cleanEnv(process.env.BLOB_READ_WRITE_TOKEN);
}

export function isBlobConfigured(): boolean {
  const token = getCleanBlobToken();
  return Boolean(
    token &&
      token.startsWith("vercel_blob_rw_") &&
      !token.includes("xxxxxxxxxxxx")
  );
}

export function isVercelBlobUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/**
 * Safely deletes a file from Vercel Blob ONLY when it belongs to Vercel Blob storage.
 * Static legacy assets in /images/real/* are untouched.
 */
export async function safeDeleteBlob(url?: string | null): Promise<void> {
  if (!url || !isBlobConfigured() || !isVercelBlobUrl(url)) {
    return;
  }
  try {
    await del(url, { token: getCleanBlobToken() });
  } catch (error) {
    console.warn(
      "[CMS Blob] Falha não-bloqueante ao remover blob antigo:",
      error
    );
  }
}
