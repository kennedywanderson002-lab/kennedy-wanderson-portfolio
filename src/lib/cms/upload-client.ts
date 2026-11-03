"use client";

import { upload, uploadPresigned } from "@vercel/blob/client";

export interface UploadedAdminImage {
  url: string;
  pathname: string;
}

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
const SERVER_FALLBACK_MAX_BYTES = Math.floor(4.4 * 1024 * 1024); // Safe below Vercel 4.5 MB function payload limit

function buildCleanPathname(fileName: string): string {
  const cleanName = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `portfolio/${cleanName}`;
}

function encodeProxyMediaPath(pathname: string): string {
  return `/api/media/${pathname
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/")}`;
}

function isPrivateStoreError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = `${err.name} ${err.message}`.toLowerCase();
  return (
    msg.includes("blobaccesserror") ||
    msg.includes("private store") ||
    msg.includes("cannot use public access") ||
    (msg.includes("access") && msg.includes("private"))
  );
}

async function fetchServerUploadDiagnostic(): Promise<{
  configured: boolean;
  mode?: string;
  error?: string;
} | null> {
  try {
    const res = await fetch("/api/admin/upload", {
      method: "GET",
      cache: "no-store",
    });
    const data = (await res.json()) as {
      configured?: boolean;
      mode?: string;
      error?: string;
    };
    return {
      configured: Boolean(data.configured),
      mode: data.mode,
      error: data.error,
    };
  } catch {
    return null;
  }
}

async function uploadViaServerFormData(
  file: File
): Promise<UploadedAdminImage> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  });

  const payload = (await res.json().catch(() => ({}))) as {
    url?: string;
    pathname?: string;
    error?: string;
  };

  if (!res.ok || !payload.url || !payload.pathname) {
    throw new Error(
      payload.error || `Falha no envio da fotografia (HTTP ${res.status}).`
    );
  }

  return {
    url: payload.url,
    pathname: payload.pathname,
  };
}

/**
 * Universal Fine-Art Photo Uploader:
 * - Works with Vercel 2026 OIDC (`BLOB_STORE_ID`), static `BLOB_READ_WRITE_TOKEN`, and custom prefixes
 * - Works seamlessly whether the Vercel Blob Store was created as `Public` OR `Private`
 * - Supports high-resolution files up to 25 MB via presigned direct upload, with automatic server `FormData` fallback
 */
export async function uploadAdminImage(
  file: File
): Promise<UploadedAdminImage> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Formato inválido. Envie apenas JPG, PNG, WebP ou AVIF."
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("A imagem excede o limite máximo de 25 MB.");
  }

  const pathname = buildCleanPathname(file.name);
  const useMultipart = file.size > 5 * 1024 * 1024;

  // 1. Primary path: Direct Presigned Upload (supports BOTH OIDC BLOB_STORE_ID & BLOB_READ_WRITE_TOKEN up to 25 MB)
  try {
    const publicBlob = await uploadPresigned(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload",
      contentType: file.type,
      multipart: useMultipart,
    });

    return {
      url: publicBlob.url,
      pathname: publicBlob.pathname,
    };
  } catch (presignedPublicErr) {
    // 2. If the store on Vercel was created in Private mode, automatically retry with `access: "private"`
    if (isPrivateStoreError(presignedPublicErr)) {
      const privateBlob = await uploadPresigned(pathname, file, {
        access: "private",
        handleUploadUrl: "/api/admin/upload",
        contentType: file.type,
        multipart: useMultipart,
      });

      return {
        url: encodeProxyMediaPath(privateBlob.pathname),
        pathname: privateBlob.pathname,
      };
    }

    // 3. Check server diagnostic to detect unlinked store (503) or static RW token fallback
    const diag = await fetchServerUploadDiagnostic();
    if (diag && !diag.configured && diag.error) {
      throw new Error(diag.error);
    }

    // 4. If static read-write token is active, try client-token upload (supports up to 25 MB)
    if (diag?.configured && diag.mode === "read-write-token") {
      try {
        const clientBlob = await upload(pathname, file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
          contentType: file.type,
          multipart: useMultipart,
        });
        return {
          url: clientBlob.url,
          pathname: clientBlob.pathname,
        };
      } catch (clientPublicErr) {
        if (isPrivateStoreError(clientPublicErr)) {
          const clientPrivateBlob = await upload(pathname, file, {
            access: "private",
            handleUploadUrl: "/api/admin/upload",
            contentType: file.type,
            multipart: useMultipart,
          });
          return {
            url: encodeProxyMediaPath(clientPrivateBlob.pathname),
            pathname: clientPrivateBlob.pathname,
          };
        }
      }
    }

    // 5. Fallback for photos <= 4.4 MB: direct server-side `put()` via FormData
    if (file.size <= SERVER_FALLBACK_MAX_BYTES) {
      return await uploadViaServerFormData(file);
    }

    throw presignedPublicErr instanceof Error
      ? presignedPublicErr
      : new Error("Falha ao enviar imagem para o Vercel Blob.");
  }
}

