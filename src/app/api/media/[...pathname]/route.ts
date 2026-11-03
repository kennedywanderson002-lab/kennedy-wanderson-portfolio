import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getBlobCommandOptions, isBlobConfigured } from "@/lib/cms/blob";

const IMMUTABLE_CACHE_CONTROL =
  "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable";

export async function GET(
  request: Request,
  context: { params: Promise<{ pathname: string[] }> }
): Promise<Response> {
  if (!isBlobConfigured()) {
    return NextResponse.json(
      { error: "Armazenamento de mídia não configurado." },
      { status: 503 }
    );
  }

  const { pathname } = await context.params;
  const blobPathname = (pathname || []).filter(Boolean).join("/");

  if (!blobPathname || blobPathname.includes("..")) {
    return NextResponse.json({ error: "Caminho inválido." }, { status: 400 });
  }

  const cmdOptions = getBlobCommandOptions(request.headers);
  const ifNoneMatch = request.headers.get("if-none-match") || undefined;

  try {
    let result = await get(blobPathname, {
      access: "private",
      ifNoneMatch,
      ...cmdOptions,
    }).catch(() => null);

    if (!result) {
      result = await get(blobPathname, {
        access: "public",
        ifNoneMatch,
        ...cmdOptions,
      }).catch(() => null);
    }

    if (!result) {
      return NextResponse.json(
        { error: "Imagem não encontrada." },
        { status: 404 }
      );
    }

    if (result.statusCode === 304) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": IMMUTABLE_CACHE_CONTROL,
        },
      });
    }

    return new Response(result.stream, {
      status: 200,
      headers: {
        "Content-Type": result.blob.contentType || "image/jpeg",
        ETag: result.blob.etag,
        "Cache-Control": IMMUTABLE_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("[Media Proxy] Falha ao servir imagem do Vercel Blob:", error);
    return NextResponse.json(
      { error: "Erro ao carregar mídia." },
      { status: 500 }
    );
  }
}

