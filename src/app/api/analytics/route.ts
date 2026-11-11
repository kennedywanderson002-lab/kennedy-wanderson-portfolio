import { NextResponse } from "next/server";
import {
  recordAnalyticsEvent,
  type AnalyticsEventType,
} from "@/lib/cms/analytics";

const ALLOWED_EVENTS = new Set<AnalyticsEventType>([
  "pageview",
  "project_open",
  "whatsapp_click",
  "inquiry_submit",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      eventType?: string;
      pathname?: string;
      locale?: string;
      referrer?: string;
      projectId?: string;
      projectTitle?: string;
      deviceHint?: "mobile" | "desktop" | "tablet";
    };

    const eventType: AnalyticsEventType = ALLOWED_EVENTS.has(
      body.eventType as AnalyticsEventType
    )
      ? (body.eventType as AnalyticsEventType)
      : "pageview";

    // Ignore admin routes
    if (body.pathname && body.pathname.startsWith("/admin")) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const headers = request.headers;
    const userAgent = headers.get("user-agent") || "";
    const forwardedFor = headers.get("x-forwarded-for") || "";
    const ipAddress = forwardedFor.split(",")[0]?.trim() || "0.0.0.0";
    const country = headers.get("x-vercel-ip-country") || "";
    const city = headers.get("x-vercel-ip-city") || "";

    await recordAnalyticsEvent({
      eventType,
      pathname: body.pathname || "/",
      locale: body.locale || "fr",
      referrer: body.referrer || headers.get("referer") || "",
      projectId: body.projectId || "",
      projectTitle: body.projectTitle || "",
      deviceHint: body.deviceHint,
      userAgent,
      ipAddress,
      country,
      city,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

