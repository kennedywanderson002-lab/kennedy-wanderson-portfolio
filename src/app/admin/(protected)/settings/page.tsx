import React from "react";
import { getAdminSiteSettings } from "@/lib/cms/queries";
import { SettingsManagerClient } from "@/components/admin/SettingsManagerClient";

export default async function AdminSettingsPage() {
  const { settings } = await getAdminSiteSettings();
  return <SettingsManagerClient initialSettings={settings} />;
}

