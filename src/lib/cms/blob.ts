import { del } from "@vercel/blob";
import { cleanEnv } from "@/lib/env";

export interface ResolvedBlobCredentials {
  configured: boolean;
  mode: "read-write-token" | "oidc-store-id" | "none";
  token?: string;
  storeId?: string;
  oidcToken?: string;
  matchedEnvKey?: string;
  detectedBlobEnvKeys: string[];
}

function isValidReadWriteToken(val: string): boolean {
  return Boolean(
    val &&
      val.startsWith("vercel_blob_rw_") &&
      !val.includes("xxxxxxxxxxxx")
  );
}

function isValidStoreId(val: string): boolean {
  return Boolean(
    val &&
      val.startsWith("store_") &&
      val.length > "store_".length &&
      !val.includes("xxxxxxxxxxxx")
  );
}

/**
 * Discovers Vercel Blob credentials across all Vercel Storage provisioning modes:
 * 1. Standard static token: `BLOB_READ_WRITE_TOKEN` (`vercel_blob_rw_...`)
 * 2. Custom-prefixed static token: `<PREFIX>_READ_WRITE_TOKEN` (`vercel_blob_rw_...`)
 * 3. Vercel 2026 OIDC connection: `BLOB_STORE_ID` (`store_...`) + OIDC token
 * 4. Custom-prefixed OIDC connection: `<PREFIX>_STORE_ID` (`store_...`) + OIDC token
 */
export function resolveBlobCredentials(
  requestHeaders?: Headers
): ResolvedBlobCredentials {
  const detectedBlobEnvKeys: string[] = [];

  for (const key of Object.keys(process.env)) {
    if (/blob|store_id|vercel_oidc/i.test(key)) {
      detectedBlobEnvKeys.push(key);
    }
  }

  // 1. Check standard BLOB_READ_WRITE_TOKEN first
  const directRwToken = cleanEnv(process.env.BLOB_READ_WRITE_TOKEN);
  if (isValidReadWriteToken(directRwToken)) {
    return {
      configured: true,
      mode: "read-write-token",
      token: directRwToken,
      matchedEnvKey: "BLOB_READ_WRITE_TOKEN",
      detectedBlobEnvKeys,
    };
  }

  // 2. Check any custom-prefixed *_READ_WRITE_TOKEN or env var with vercel_blob_rw_ prefix
  for (const [key, rawVal] of Object.entries(process.env)) {
    const cleaned = cleanEnv(rawVal);
    if (isValidReadWriteToken(cleaned)) {
      return {
        configured: true,
        mode: "read-write-token",
        token: cleaned,
        matchedEnvKey: key,
        detectedBlobEnvKeys,
      };
    }
  }

  const headerOidc = cleanEnv(requestHeaders?.get("x-vercel-oidc-token"));
  const envOidc = cleanEnv(process.env.VERCEL_OIDC_TOKEN);
  const oidcToken = headerOidc || envOidc || undefined;

  // 3. Check standard BLOB_STORE_ID (Vercel 2026 OIDC Storage integration)
  const directStoreId = cleanEnv(process.env.BLOB_STORE_ID);
  if (isValidStoreId(directStoreId)) {
    return {
      configured: true,
      mode: "oidc-store-id",
      storeId: directStoreId,
      oidcToken,
      matchedEnvKey: "BLOB_STORE_ID",
      detectedBlobEnvKeys,
    };
  }

  // 4. Check any custom-prefixed *_STORE_ID
  for (const [key, rawVal] of Object.entries(process.env)) {
    if (!/store_id|blob/i.test(key)) continue;
    const cleaned = cleanEnv(rawVal);
    if (isValidStoreId(cleaned)) {
      return {
        configured: true,
        mode: "oidc-store-id",
        storeId: cleaned,
        oidcToken,
        matchedEnvKey: key,
        detectedBlobEnvKeys,
      };
    }
  }

  return {
    configured: false,
    mode: "none",
    detectedBlobEnvKeys,
  };
}

export function getCleanBlobToken(): string {
  const creds = resolveBlobCredentials();
  return creds.token || "";
}

export function getBlobCommandOptions(requestHeaders?: Headers): {
  token?: string;
  storeId?: string;
  oidcToken?: string;
} {
  const creds = resolveBlobCredentials(requestHeaders);
  if (creds.mode === "read-write-token" && creds.token) {
    return { token: creds.token };
  }
  if (creds.mode === "oidc-store-id" && creds.storeId) {
    return {
      storeId: creds.storeId,
      ...(creds.oidcToken ? { oidcToken: creds.oidcToken } : {}),
    };
  }
  return {};
}

export function isBlobConfigured(): boolean {
  return resolveBlobCredentials().configured;
}

export function encodeBlobPathnameForProxy(pathname: string): string {
  return pathname
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

export function toPublicServedBlobUrl(
  blobUrl: string,
  pathname: string,
  access: "public" | "private"
): string {
  if (
    access === "private" ||
    blobUrl.includes(".private.blob.vercel-storage.com")
  ) {
    return `/api/media/${encodeBlobPathnameForProxy(pathname)}`;
  }
  return blobUrl;
}

export function extractProxyMediaPathname(url?: string | null): string | null {
  if (!url || !url.startsWith("/api/media/")) return null;
  const raw = url.slice("/api/media/".length).split("?")[0] || "";
  if (!raw) return null;
  return raw
    .split("/")
    .filter(Boolean)
    .map((seg) => decodeURIComponent(seg))
    .join("/");
}

export function isVercelBlobUrl(url?: string | null): boolean {
  if (!url) return false;
  if (url.startsWith("/api/media/")) return true;
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
    const proxyPathname = extractProxyMediaPathname(url);
    const target = proxyPathname || url;
    await del(target, getBlobCommandOptions());
  } catch (error) {
    console.warn(
      "[CMS Blob] Falha não-bloqueante ao remover blob antigo:",
      error
    );
  }
}
