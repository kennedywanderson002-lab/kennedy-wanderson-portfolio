"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Images,
  FolderKanban,
  FileText,
  Inbox,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

interface AdminSidebarProps {
  adminName: string;
  adminEmail: string;
  newInquiriesCount?: number;
}

const NAV_ITEMS = [
  { href: "/admin", label: "Visão Geral", icon: LayoutDashboard, exact: true },
  {
    href: "/admin/analytics",
    label: "Análise de Acessos",
    icon: BarChart3,
  },
  { href: "/admin/hero", label: "Slides da Capa (Hero)", icon: Images },
  {
    href: "/admin/portfolio",
    label: "Portfólio & Ordem",
    icon: FolderKanban,
  },
  {
    href: "/admin/content",
    label: "Sobre & Textos (FR/PT/EN)",
    icon: FileText,
  },
  {
    href: "/admin/inquiries",
    label: "Orçamentos Recebidos",
    icon: Inbox,
    badgeKey: "inquiries",
  },
  {
    href: "/admin/settings",
    label: "Contato & Senha",
    icon: Settings,
  },
];

export function AdminSidebar({
  adminName,
  adminEmail,
  newInquiriesCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/admin/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between bg-[#181716] text-[#FAF9F6] w-72 shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="px-7 py-8 border-b border-white/10">
          <p className="text-[9px] uppercase tracking-[0.38em] text-[#BFA989] mb-1.5">
            Atelier Admin
          </p>
          <p className="font-serif text-lg tracking-[0.2em] uppercase text-white font-light">
            Kennedy Wanderson
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 py-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            const showBadge =
              item.badgeKey === "inquiries" && newInquiriesCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-4 py-3 text-xs tracking-wide transition-colors ${
                  active
                    ? "bg-[#9E8765] text-white font-medium"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={16} strokeWidth={1.6} />
                  <span>{item.label}</span>
                </span>
                {showBadge && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-white text-[#181716]">
                    {newInquiriesCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions & User Info */}
      <div className="p-5 border-t border-white/10 space-y-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-2.5 border border-white/15 text-[10px] uppercase tracking-[0.22em] text-white/85 hover:bg-white hover:text-[#181716] transition-colors"
        >
          <span>Ver Site Ao Vivo</span>
          <ExternalLink size={13} />
        </a>

        <div className="px-1 pt-1 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-white font-medium truncate">
              {adminName}
            </p>
            <p className="text-[11px] text-white/50 truncate">{adminEmail}</p>
          </div>
          <button
            type="button"
            disabled={signingOut}
            onClick={handleSignOut}
            title="Sair do painel"
            aria-label="Sair do painel"
            className="p-2 text-white/60 hover:text-red-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-[#181716] text-white px-5 py-4 border-b border-white/10">
        <div>
          <span className="block text-[8px] uppercase tracking-[0.35em] text-[#BFA989]">
            Atelier Admin
          </span>
          <span className="font-serif text-base tracking-[0.18em] uppercase">
            Kennedy Wanderson
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu administrativo"
          className="p-2 text-white/80 hover:text-white"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex h-full">
            {navContent}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
              className="self-start m-3 p-2 rounded-full bg-black/70 text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block sticky top-0 h-screen shrink-0">
        {navContent}
      </aside>
    </>
  );
}

