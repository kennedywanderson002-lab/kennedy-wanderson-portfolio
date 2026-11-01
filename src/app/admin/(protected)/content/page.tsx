import React from "react";
import { getAdminSiteSettings } from "@/lib/cms/queries";
import { ContentManagerClient } from "@/components/admin/ContentManagerClient";

export default async function AdminContentPage() {
  const { settings } = await getAdminSiteSettings();
  return <ContentManagerClient initialSettings={settings} />;
}

