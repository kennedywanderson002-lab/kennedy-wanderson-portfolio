import React from "react";
import { getAdminInquiries } from "@/lib/cms/queries";
import { InquiriesInboxClient } from "@/components/admin/InquiriesInboxClient";

export default async function AdminInquiriesPage() {
  const inquiries = await getAdminInquiries();
  return <InquiriesInboxClient initialInquiries={inquiries} />;
}

