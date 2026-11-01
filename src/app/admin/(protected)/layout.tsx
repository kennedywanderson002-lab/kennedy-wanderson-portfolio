import type { Metadata } from "next";
import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getOptionalAdminSession } from "@/lib/auth";
import { getAdminOverviewStats } from "@/lib/cms/queries";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata: Metadata = {
  title: "Painel Administrativo · Kennedy Wanderson",
  robots: {
    index: false,
    follow: false,
  },
};

function AdminShellSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col lg:flex-row">
      <div className="hidden lg:block w-72 h-screen bg-[#181716]" />
      <div className="flex-1 p-8 sm:p-12">
        <div className="h-6 w-48 bg-[#E5E1DA] animate-pulse mb-4" />
        <div className="h-4 w-72 bg-[#EFECE6] animate-pulse" />
      </div>
    </div>
  );
}

async function AuthenticatedAdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOptionalAdminSession();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const stats = await getAdminOverviewStats();

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#181716] flex flex-col lg:flex-row">
      <AdminSidebar
        adminName={session.user.name || "Kennedy Wanderson"}
        adminEmail={session.user.email}
        newInquiriesCount={stats.newInquiriesCount}
      />

      <main className="flex-1 min-w-0 px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminShellSkeleton />}>
      <AuthenticatedAdminShell>{children}</AuthenticatedAdminShell>
    </Suspense>
  );
}

