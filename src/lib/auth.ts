import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { connection } from "next/server";
import { getDb, isDatabaseConfigured, schema } from "@/db";

function createAuthInstance() {
  const db = getDb();

  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || undefined,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true, // Strictly single-tenant admin: public registration is disabled
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14, // 14 days
      updateAge: 60 * 60 * 24, // refresh every 24h
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 min signed cookie cache for fast Fluid Compute checks
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 20,
      storage: "database",
    },
    trustedOrigins: ["https://*.vercel.app"],
    plugins: [nextCookies()], // Must remain last in plugins array
  });
}

let cachedAuth: ReturnType<typeof createAuthInstance> | null = null;

export function getAuth() {
  if (!cachedAuth) {
    cachedAuth = createAuthInstance();
  }
  return cachedAuth;
}

export async function getOptionalAdminSession() {
  await connection();
  if (!isDatabaseConfigured()) {
    return null;
  }
  try {
    const auth = getAuth();
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "Banco de dados não configurado. Conecte o Neon Postgres nas variáveis de ambiente."
    );
  }
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new Error("Acesso não autorizado. Faça login novamente.");
  }
  return session;
}

