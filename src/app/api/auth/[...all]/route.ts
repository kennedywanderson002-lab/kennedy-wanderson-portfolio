import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/db";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Banco de dados ainda não conectado. Configure DATABASE_URL e BETTER_AUTH_SECRET no painel da Vercel ou em .env.local.",
      },
      { status: 503 }
    );
  }
  const { GET: authGet } = toNextJsHandler(getAuth());
  return authGet(request);
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Banco de dados ainda não conectado. Configure DATABASE_URL e BETTER_AUTH_SECRET no painel da Vercel ou em .env.local.",
      },
      { status: 503 }
    );
  }
  const { POST: authPost } = toNextJsHandler(getAuth());
  return authPost(request);
}

