import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { cleanEnv } from "@/lib/env";

let cachedDb: NeonHttpDatabase<typeof schema> | null = null;

export function getCleanDatabaseUrl(): string {
  return cleanEnv(process.env.DATABASE_URL);
}

/**
 * Checks whether a valid Postgres connection string is configured.
 * Allows static builds and local fallback previews to run safely even before
 * Neon Storage is connected in the Vercel dashboard.
 */
export function isDatabaseConfigured(): boolean {
  const url = getCleanDatabaseUrl();
  return Boolean(
    url &&
      (url.startsWith("postgres://") || url.startsWith("postgresql://")) &&
      !url.includes("ep-example.eu-central-1.aws.neon.tech")
  );
}

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "DATABASE_URL is not configured. Connect Neon Postgres in Vercel Storage or set DATABASE_URL in .env.local."
    );
  }

  if (!cachedDb) {
    const sql = neon(getCleanDatabaseUrl());
    cachedDb = drizzle({ client: sql, schema });
  }

  return cachedDb;
}

export { schema };
