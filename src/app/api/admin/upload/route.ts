import { NextResponse } from "next/server";
import { issueSignedToken, put } from "@vercel/blob";
import {
  handleUpload,
  handleUploadPresigned,
  type HandleUploadBody,
  type HandleUploadPresignedBody,
} from "@vercel/blob/client";
import { requireAdmin } from "@/lib/auth";
import {
  getBlobCommandOptions,
  resolveBlobCredentials,
  toPublicServedBlobUrl,
} from "@/lib/cms/blob";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB max per fine-art photo

function sanitizeUploadPathname(rawName: string): string {
  const baseName = rawName.split("/").pop() || "foto.jpg";
  const cleanName = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `portfolio/${cleanName}`;
}

function isPrivateStoreAccessError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = `${error.name} ${error.message}`.toLowerCase();
  return (
    msg.includes("blobaccesserror") ||
    msg.includes("private store") ||
    msg.includes("cannot use public access") ||
    (msg.includes("access") && msg.includes("private"))
  );
}

function buildMissingBlobMessage(detectedKeys: string[]): string {
  const nonOidcKeys = detectedKeys.filter(
    (k) => k.toUpperCase() !== "VERCEL_OIDC_TOKEN"
  );
  if (nonOidcKeys.length === 0) {
    return "Nenhuma variável do Vercel Blob foi encontrada neste projeto. Na Vercel, abra Storage → clique no seu Blob Store → aba Projects → Connect Project → selecione kennedy-wanderson-portfolio e faça um Redeploy.";
  }
  return `Credenciais do Vercel Blob incompletas (variáveis detectadas: ${nonOidcKeys.join(", ")}). Conecte o Blob Store ao projeto na aba Storage da Vercel e faça um Redeploy.`;
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const creds = resolveBlobCredentials(request.headers);
  if (!creds.configured) {
    return NextResponse.json(
      {
        configured: false,
        mode: creds.mode,
        detectedBlobEnvKeys: creds.detectedBlobEnvKeys,
        error: buildMissingBlobMessage(creds.detectedBlobEnvKeys),
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    configured: true,
    mode: creds.mode,
    matchedEnvKey: creds.matchedEnvKey,
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  const creds = resolveBlobCredentials(request.headers);
  if (!creds.configured) {
    return NextResponse.json(
      {
        error: buildMissingBlobMessage(creds.detectedBlobEnvKeys),
        detectedBlobEnvKeys: creds.detectedBlobEnvKeys,
      },
      { status: 503 }
    );
  }

  const cmdOptions = getBlobCommandOptions(request.headers);
  const contentType = request.headers.get("content-type") || "";

  // Branch 1: Direct Server-Side Multipart FormData Upload (works with both Public & Private stores)
  if (contentType.includes("multipart/form-data")) {
    try {
      await requireAdmin();

      const formData = await request.formData();
      const fileEntry = formData.get("file");

      if (!(fileEntry instanceof File)) {
        return NextResponse.json(
          { error: "Nenhum arquivo de imagem enviado." },
          { status: 400 }
        );
      }

      if (!ALLOWED_IMAGE_TYPES.includes(fileEntry.type)) {
        return NextResponse.json(
          {
            error: "Formato inválido. Envie apenas JPG, PNG, WebP ou AVIF.",
          },
          { status: 400 }
        );
      }

      if (fileEntry.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "A imagem excede o limite máximo de 25 MB." },
          { status: 400 }
        );
      }

      const targetPathname = sanitizeUploadPathname(fileEntry.name);

      try {
        const uploaded = await put(targetPathname, fileEntry, {
          access: "public",
          addRandomSuffix: true,
          contentType: fileEntry.type,
          ...cmdOptions,
        });

        return NextResponse.json({
          url: toPublicServedBlobUrl(
            uploaded.url,
            uploaded.pathname,
            "public"
          ),
          pathname: uploaded.pathname,
          access: "public",
        });
      } catch (publicErr) {
        if (!isPrivateStoreAccessError(publicErr)) {
          throw publicErr;
        }

        // Automatic fallback when the user's Vercel Blob store was created as Private
        const uploadedPrivate = await put(targetPathname, fileEntry, {
          access: "private",
          addRandomSuffix: true,
          contentType: fileEntry.type,
          ...cmdOptions,
        });

        return NextResponse.json({
          url: toPublicServedBlobUrl(
            uploadedPrivate.url,
            uploadedPrivate.pathname,
            "private"
          ),
          pathname: uploadedPrivate.pathname,
          access: "private",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Falha ao enviar imagem no servidor.";
      const status = message.includes("autorizado") ? 401 : 400;
      return NextResponse.json({ error: message }, { status });
    }
  }

  // Branch 2: Direct Browser Upload (Presigned URL for OIDC + RW Token, or Client Token)
  try {
    const rawBody = (await request.json()) as
      | HandleUploadPresignedBody
      | HandleUploadBody;

    if (rawBody.type === "blob.generate-presigned-url") {
      const jsonResponse = await handleUploadPresigned({
        body: rawBody,
        request,
        webhookPublicKey:
          process.env.BLOB_WEBHOOK_PUBLIC_KEY || "unused-no-callback",
        getSignedToken: async (pathname) => {
          await requireAdmin();

          const validUntil = Date.now() + 15 * 60 * 1000;
          const signedToken = await issueSignedToken({
            pathname,
            operations: ["put"],
            validUntil,
            allowedContentTypes: ALLOWED_IMAGE_TYPES,
            maximumSizeInBytes: MAX_UPLOAD_BYTES,
            ...cmdOptions,
          });

          return {
            token: signedToken,
            urlOptions: {
              addRandomSuffix: true,
              allowedContentTypes: ALLOWED_IMAGE_TYPES,
              maximumSizeInBytes: MAX_UPLOAD_BYTES,
            },
          };
        },
      });

      return NextResponse.json(jsonResponse);
    }

    // Legacy client-token handshake when static read-write token is available
    if (creds.token) {
      const jsonResponse = await handleUpload({
        token: creds.token,
        body: rawBody as HandleUploadBody,
        request,
        onBeforeGenerateToken: async () => {
          const session = await requireAdmin();
          return {
            allowedContentTypes: ALLOWED_IMAGE_TYPES,
            maximumSizeInBytes: MAX_UPLOAD_BYTES,
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({ adminId: session.user.id }),
          };
        },
        onUploadCompleted: async () => {
          // Metadata persistence happens via authenticated Server Actions
        },
      });

      return NextResponse.json(jsonResponse);
    }

    return NextResponse.json(
      { error: "Tipo de handshake de upload não suportado." },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao autorizar upload.";
    const status = message.includes("autorizado") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
