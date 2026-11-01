import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAdmin } from "@/lib/auth";
import { isBlobConfigured } from "@/lib/cms/blob";

export async function POST(request: Request): Promise<NextResponse> {
  if (!isBlobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Vercel Blob não configurado. Adicione o Vercel Blob na aba Storage do projeto na Vercel (BLOB_READ_WRITE_TOKEN).",
      },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Strict authentication check before issuing any client upload token
        const session = await requireAdmin();

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/avif",
          ],
          maximumSizeInBytes: 25 * 1024 * 1024, // 25 MB max per fine-art photo
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            adminId: session.user.id,
          }),
        };
      },
      onUploadCompleted: async () => {
        // Metadata persistence happens via authenticated Server Actions
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao autorizar upload.";
    const status = message.includes("autorizado") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

