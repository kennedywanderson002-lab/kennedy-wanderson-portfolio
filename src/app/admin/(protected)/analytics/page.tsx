import React from "react";
import {
  getAdminAnalyticsDashboard,
  type AnalyticsRangeDays,
} from "@/lib/cms/analytics";
import { AnalyticsDashboardClient } from "@/components/admin/AnalyticsDashboardClient";

interface AdminAnalyticsPageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: AdminAnalyticsPageProps) {
  const params = await searchParams;
  const parsedDays = Number.parseInt(params.days || "30", 10);
  const rangeDays: AnalyticsRangeDays =
    parsedDays === 7 ||
    parsedDays === 30 ||
    parsedDays === 90 ||
    parsedDays === 365
      ? parsedDays
      : 30;

  const summary = await getAdminAnalyticsDashboard(rangeDays);

  return <AnalyticsDashboardClient summary={summary} />;
}
