/**
 * Strips accidental surrounding quotes ("..." or '...') and whitespace
 * that often happen when copying .env lines into cloud dashboards.
 */
export function cleanEnv(raw?: string | null): string {
  if (!raw) return "";
  return raw.trim().replace(/^["']+|["']+$/g, "").trim();
}

/**
 * Safely resolves a base URL string for Better Auth.
 * Never throws: if invalid or empty, returns undefined so Better Auth
 * infers the origin directly from the incoming HTTP request.
 */
export function resolveValidBaseUrl(raw?: string | null): string | undefined {
  const cleaned = cleanEnv(raw);
  if (!cleaned) return undefined;

  const withProtocol =
    cleaned.startsWith("http://") || cleaned.startsWith("https://")
      ? cleaned
      : `https://${cleaned}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.origin;
  } catch {
    return undefined;
  }
}

