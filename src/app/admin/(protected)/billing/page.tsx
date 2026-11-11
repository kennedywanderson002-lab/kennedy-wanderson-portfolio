import React, { Suspense } from "react";
import { getBillingDashboardData, type BillingDocType } from "@/lib/cms/billing";
import {
  BillingManagerClient,
  type InitialInquiryDraft,
} from "@/components/admin/BillingManagerClient";

interface AdminBillingPageProps {
  searchParams: Promise<{
    fromInquiry?: string;
    inquiryId?: string;
    docType?: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    eventDate?: string;
    eventLocation?: string;
    guestCount?: string;
  }>;
}

async function BillingContent({ searchParams }: AdminBillingPageProps) {
  const [data, params] = await Promise.all([
    getBillingDashboardData(),
    searchParams,
  ]);

  let initialInquiryDraft: InitialInquiryDraft | null = null;
  if (params.fromInquiry === "1" || params.clientName) {
    initialInquiryDraft = {
      inquiryId: params.inquiryId || "",
      docType: (params.docType === "facture" ? "facture" : "devis") as BillingDocType,
      clientName: params.clientName || "",
      clientEmail: params.clientEmail || "",
      clientPhone: params.clientPhone || "",
      eventDate: params.eventDate || "",
      eventLocation: params.eventLocation || "",
      guestCount: params.guestCount || "",
    };
  }

  return (
    <BillingManagerClient
      initialData={data}
      initialInquiryDraft={initialInquiryDraft}
    />
  );
}

export default function AdminBillingPage(props: AdminBillingPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-[#E5E1DA]" />
          <div className="h-32 w-full bg-white border border-[#E5E1DA]" />
        </div>
      }
    >
      <BillingContent {...props} />
    </Suspense>
  );
}

