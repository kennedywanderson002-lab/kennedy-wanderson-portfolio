import React, { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getOptionalAdminSession } from "@/lib/auth";
import { getBillingDocumentById } from "@/lib/cms/billing";
import { BillingPrintClient } from "@/components/admin/BillingPrintClient";

interface BillingPrintPageProps {
  params: Promise<{ id: string }>;
}

async function AuthenticatedPrintView({ params }: BillingPrintPageProps) {
  const session = await getOptionalAdminSession();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const doc = await getBillingDocumentById(id);

  if (!doc) {
    notFound();
  }

  return <BillingPrintClient document={doc} />;
}

export default function BillingPrintPage(props: BillingPrintPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EAE7E1] flex items-center justify-center text-xs uppercase tracking-[0.25em] text-[#5E5952]">
          Preparando Folha A4...
        </div>
      }
    >
      <AuthenticatedPrintView {...props} />
    </Suspense>
  );
}

