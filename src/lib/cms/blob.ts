import { del } from "@vercel/blob";

export function isBlobConfigured(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
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
    await del(url);
  } catch (error) {
    console.warn("[CMS Blob] Falha não-bloqueante ao remover blob antigo:", error);
  }
}

