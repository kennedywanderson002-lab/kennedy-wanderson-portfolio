import { createHash } from "crypto";
import { desc, gte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb, isDatabaseConfigured, schema } from "@/db";

export type AnalyticsEventType =
  | "pageview"
  | "project_open"
  | "whatsapp_click"
  | "inquiry_submit";

export type AnalyticsRangeDays = 7 | 30 | 90 | 365;

export interface RecordAnalyticsInput {
  eventType: AnalyticsEventType;
  pathname?: string;
  locale?: string;
  referrer?: string;
  projectId?: string;
  projectTitle?: string;
  userAgent?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  deviceHint?: "mobile" | "desktop" | "tablet";
}

export interface AnalyticsDailyPoint {
  dateKey: string; // YYYY-MM-DD
  label: string; // DD/MM
  pageviews: number;
  uniqueVisitors: number;
}

export interface AnalyticsBreakdownItem {
  label: string;
  code?: string;
  count: number;
  percentage: number;
}

export interface AnalyticsTopProjectItem {
  projectId: string;
  projectTitle: string;
  opens: number;
  uniqueViewers: number;
}

export interface AnalyticsRecentEventItem {
  id: string;
  eventType: AnalyticsEventType;
  deviceType: string;
  locale: string;
  country: string;
  city: string;
  referrerSource: string;
  projectTitle: string;
  createdAt: string;
}

export interface AdminAnalyticsSummary {
  rangeDays: AnalyticsRangeDays;
  totalPageviews: number;
  todayPageviews: number;
  uniqueVisitors: number;
  todayUniqueVisitors: number;
  projectOpens: number;
  whatsappClicks: number;
  inquirySubmits: number;
  dailySeries: AnalyticsDailyPoint[];
  devices: AnalyticsBreakdownItem[];
  locales: AnalyticsBreakdownItem[];
  countries: AnalyticsBreakdownItem[];
  cities: AnalyticsBreakdownItem[];
  referrers: AnalyticsBreakdownItem[];
  topProjects: AnalyticsTopProjectItem[];
  recentEvents: AnalyticsRecentEventItem[];
}

let tableEnsured = false;

export async function ensureAnalyticsTable(): Promise<void> {
  if (tableEnsured || !isDatabaseConfigured()) return;
  try {
    const db = getDb();
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS site_analytics_events (
        id text PRIMARY KEY,
        event_type text NOT NULL DEFAULT 'pageview',
        visitor_hash text NOT NULL,
        pathname text NOT NULL DEFAULT '/',
        device_type text NOT NULL DEFAULT 'desktop',
        locale text NOT NULL DEFAULT 'fr',
        country text DEFAULT '',
        city text DEFAULT '',
        referrer_source text NOT NULL DEFAULT 'Direto',
        project_id text DEFAULT '',
        project_title text DEFAULT '',
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS analytics_created_at_idx ON site_analytics_events (created_at);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS analytics_event_type_idx ON site_analytics_events (event_type);
    `);
    tableEnsured = true;
  } catch (err) {
    console.warn("[Analytics] Aviso ao garantir tabela:", err);
  }
}

export function isBotUserAgent(ua: string): boolean {
  if (!ua) return false;
  return /bot|crawler|spider|crawling|headless|lighthouse|pingdom|gtmetrix|facebookexternalhit|whatsapp|slurp|bingpreview|vercel-screenshot/i.test(
    ua
  );
}

export function detectDeviceType(
  ua: string,
  hint?: "mobile" | "desktop" | "tablet"
): "mobile" | "desktop" | "tablet" {
  if (hint === "mobile" || hint === "desktop" || hint === "tablet") {
    return hint;
  }
  if (/ipad|tablet|playbook|silk/i.test(ua)) {
    return "tablet";
  }
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

export function normalizeReferrerSource(rawReferrer?: string | null): string {
  if (!rawReferrer || !rawReferrer.trim()) return "Acesso Direto";
  try {
    const url = new URL(rawReferrer);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (
      host.includes("kennedywanderson") ||
      host.includes("kennedy-wanderson") ||
      host.includes("localhost")
    ) {
      return "Acesso Direto";
    }
    if (host.includes("instagram.com") || host.includes("ig.me")) {
      return "Instagram";
    }
    if (host.includes("google.")) {
      return "Google";
    }
    if (host.includes("whatsapp.com") || host.includes("wa.me")) {
      return "WhatsApp";
    }
    if (host.includes("facebook.com") || host.includes("fb.com")) {
      return "Facebook";
    }
    if (host.includes("pinterest.")) {
      return "Pinterest";
    }
    if (host.includes("tiktok.com")) {
      return "TikTok";
    }
    if (host.includes("bing.com")) {
      return "Bing";
    }
    return host.slice(0, 40);
  } catch {
    return "Acesso Direto";
  }
}

const COUNTRY_NAMES: Record<string, string> = {
  FR: "França",
  BR: "Brasil",
  PT: "Portugal",
  CH: "Suíça",
  BE: "Bélgica",
  IT: "Itália",
  ES: "Espanha",
  GB: "Reino Unido",
  UK: "Reino Unido",
  US: "Estados Unidos",
  DE: "Alemanha",
  LU: "Luxemburgo",
  MC: "Mônaco",
  CA: "Canadá",
  NL: "Países Baixos",
  AE: "Emirados Árabes",
};

export function formatCountryName(code?: string | null): string {
  if (!code || !code.trim()) return "Não identificado";
  const upper = code.trim().toUpperCase();
  return COUNTRY_NAMES[upper] ? `${COUNTRY_NAMES[upper]} (${upper})` : upper;
}

export function buildAnonymousVisitorHash(
  ipAddress: string,
  userAgent: string
): string {
  const daySalt = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${daySalt}|${ipAddress || "anon"}|${userAgent || "ua"}`)
    .digest("hex")
    .slice(0, 20);
}

export async function recordAnalyticsEvent(
  input: RecordAnalyticsInput
): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const ua = input.userAgent || "";
  if (isBotUserAgent(ua)) return;

  try {
    await ensureAnalyticsTable();
    const db = getDb();

    const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const visitorHash = buildAnonymousVisitorHash(
      input.ipAddress || "0.0.0.0",
      ua
    );
    const deviceType = detectDeviceType(ua, input.deviceHint);
    const locale =
      input.locale === "pt" || input.locale === "en" || input.locale === "fr"
        ? input.locale
        : "fr";
    const referrerSource = normalizeReferrerSource(input.referrer);
    const country = (input.country || "").trim().toUpperCase().slice(0, 8);
    let city = (input.city || "").trim().slice(0, 60);
    try {
      city = decodeURIComponent(city);
    } catch {
      // keep raw city string
    }

    await db.insert(schema.siteAnalyticsEvents).values({
      id,
      eventType: input.eventType,
      visitorHash,
      pathname: (input.pathname || "/").slice(0, 120),
      deviceType,
      locale,
      country,
      city,
      referrerSource,
      projectId: (input.projectId || "").slice(0, 80),
      projectTitle: (input.projectTitle || "").slice(0, 140),
    });
  } catch (err) {
    console.warn("[Analytics] Falha silenciosa ao registrar evento:", err);
  }
}

function buildBreakdown(
  counts: Map<string, number>,
  total: number,
  limit = 6
): AnalyticsBreakdownItem[] {
  const safeTotal = Math.max(total, 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / safeTotal) * 100),
    }));
}

export async function getAdminAnalyticsDashboard(
  rangeDays: AnalyticsRangeDays = 30
): Promise<AdminAnalyticsSummary> {
  await connection();

  const emptySummary: AdminAnalyticsSummary = {
    rangeDays,
    totalPageviews: 0,
    todayPageviews: 0,
    uniqueVisitors: 0,
    todayUniqueVisitors: 0,
    projectOpens: 0,
    whatsappClicks: 0,
    inquirySubmits: 0,
    dailySeries: [],
    devices: [],
    locales: [],
    countries: [],
    cities: [],
    referrers: [],
    topProjects: [],
    recentEvents: [],
  };

  if (!isDatabaseConfigured()) {
    return emptySummary;
  }

  try {
    await ensureAnalyticsTable();
    const db = getDb();

    const now = new Date();
    const sinceDate = new Date(
      now.getTime() - rangeDays * 24 * 60 * 60 * 1000
    );
    const todayKey = now.toISOString().slice(0, 10);

    const rows = await db
      .select()
      .from(schema.siteAnalyticsEvents)
      .where(gte(schema.siteAnalyticsEvents.createdAt, sinceDate))
      .orderBy(desc(schema.siteAnalyticsEvents.createdAt));

    let totalPageviews = 0;
    let todayPageviews = 0;
    let projectOpens = 0;
    let whatsappClicks = 0;
    let inquirySubmits = 0;

    const allVisitors = new Set<string>();
    const todayVisitors = new Set<string>();

    const deviceCounts = new Map<string, number>();
    const localeCounts = new Map<string, number>();
    const countryCounts = new Map<string, number>();
    const cityCounts = new Map<string, number>();
    const referrerCounts = new Map<string, number>();

    const projectStats = new Map<
      string,
      { title: string; opens: number; viewers: Set<string> }
    >();

    // Initialize daily series buckets for the chart (up to last 14 or 30 days)
    const chartDays = Math.min(rangeDays, 30);
    const dailyMap = new Map<
      string,
      { pageviews: number; visitors: Set<string>; label: string }
    >();

    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const day = String(d.getUTCDate()).padStart(2, "0");
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      dailyMap.set(key, {
        pageviews: 0,
        visitors: new Set(),
        label: `${day}/${month}`,
      });
    }

    for (const row of rows) {
      const dateKey = row.createdAt.toISOString().slice(0, 10);
      allVisitors.add(row.visitorHash);
      if (dateKey === todayKey) {
        todayVisitors.add(row.visitorHash);
      }

      const dayBucket = dailyMap.get(dateKey);
      if (dayBucket) {
        dayBucket.visitors.add(row.visitorHash);
      }

      if (row.eventType === "pageview") {
        totalPageviews++;
        if (dateKey === todayKey) {
          todayPageviews++;
        }
        if (dayBucket) {
          dayBucket.pageviews++;
        }

        const devLabel =
          row.deviceType === "mobile"
            ? "Celular (Mobile)"
            : row.deviceType === "tablet"
              ? "Tablet"
              : "Computador (PC)";
        deviceCounts.set(devLabel, (deviceCounts.get(devLabel) || 0) + 1);

        const locLabel =
          row.locale === "pt"
            ? "Português (PT)"
            : row.locale === "en"
              ? "English (EN)"
              : "Français (FR)";
        localeCounts.set(locLabel, (localeCounts.get(locLabel) || 0) + 1);

        const countryLabel = formatCountryName(row.country);
        countryCounts.set(
          countryLabel,
          (countryCounts.get(countryLabel) || 0) + 1
        );

        if (row.city && row.city.trim()) {
          const cityLabel = row.country
            ? `${row.city} (${row.country})`
            : row.city;
          cityCounts.set(cityLabel, (cityCounts.get(cityLabel) || 0) + 1);
        }

        const refLabel = row.referrerSource || "Acesso Direto";
        referrerCounts.set(refLabel, (referrerCounts.get(refLabel) || 0) + 1);
      } else if (row.eventType === "project_open") {
        projectOpens++;
        const pKey = row.projectId || row.projectTitle || "unknown";
        const pTitle = row.projectTitle || "História do Portfólio";
        const existing = projectStats.get(pKey) || {
          title: pTitle,
          opens: 0,
          viewers: new Set<string>(),
        };
        existing.opens++;
        existing.viewers.add(row.visitorHash);
        projectStats.set(pKey, existing);
      } else if (row.eventType === "whatsapp_click") {
        whatsappClicks++;
      } else if (row.eventType === "inquiry_submit") {
        inquirySubmits++;
      }
    }

    const dailySeries: AnalyticsDailyPoint[] = Array.from(
      dailyMap.entries()
    ).map(([dateKey, item]) => ({
      dateKey,
      label: item.label,
      pageviews: item.pageviews,
      uniqueVisitors: item.visitors.size,
    }));

    const topProjects: AnalyticsTopProjectItem[] = Array.from(
      projectStats.entries()
    )
      .map(([projectId, item]) => ({
        projectId,
        projectTitle: item.title,
        opens: item.opens,
        uniqueViewers: item.viewers.size,
      }))
      .sort((a, b) => b.opens - a.opens)
      .slice(0, 8);

    const recentEvents: AnalyticsRecentEventItem[] = rows
      .slice(0, 15)
      .map((r) => ({
        id: r.id,
        eventType:
          r.eventType === "project_open" ||
          r.eventType === "whatsapp_click" ||
          r.eventType === "inquiry_submit"
            ? r.eventType
            : "pageview",
        deviceType: r.deviceType,
        locale: r.locale,
        country: formatCountryName(r.country),
        city: r.city || "",
        referrerSource: r.referrerSource,
        projectTitle: r.projectTitle || "",
        createdAt: r.createdAt.toISOString(),
      }));

    return {
      rangeDays,
      totalPageviews,
      todayPageviews,
      uniqueVisitors: allVisitors.size,
      todayUniqueVisitors: todayVisitors.size,
      projectOpens,
      whatsappClicks,
      inquirySubmits,
      dailySeries,
      devices: buildBreakdown(deviceCounts, totalPageviews, 4),
      locales: buildBreakdown(localeCounts, totalPageviews, 4),
      countries: buildBreakdown(countryCounts, totalPageviews, 8),
      cities: buildBreakdown(cityCounts, totalPageviews, 8),
      referrers: buildBreakdown(referrerCounts, totalPageviews, 6),
      topProjects,
      recentEvents,
    };
  } catch (err) {
    console.warn("[Analytics] Erro ao carregar resumo:", err);
    return emptySummary;
  }
}

