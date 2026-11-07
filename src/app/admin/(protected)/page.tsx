import React from "react";
import Link from "next/link";
import {
  Images,
  FolderKanban,
  FileText,
  Inbox,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { getAdminOverviewStats } from "@/lib/cms/queries";
import { getAdminAnalyticsDashboard } from "@/lib/cms/analytics";
import { SeedInitializerBanner } from "@/components/admin/SeedInitializerBanner";

export default async function AdminDashboardPage() {
  const [stats, analytics] = await Promise.all([
    getAdminOverviewStats(),
    getAdminAnalyticsDashboard(30),
  ]);

  const cards = [
    {
      title: "Análise de Acessos (30d)",
      value: `${analytics.totalPageviews} visitas`,
      subtitle: `${analytics.uniqueVisitors} visitantes únicos · Hoje: ${analytics.todayPageviews}`,
      href: "/admin/analytics",
      action: "Ver Países, Celular vs PC & Cliques",
      icon: BarChart3,
    },
    {
      title: "Slides da Capa (Hero)",
      value: `${stats.visibleHeroCount} / ${stats.heroCount}`,
      subtitle: "slides visíveis na abertura",
      href: "/admin/hero",
      action: "Ordenar & Editar Slides",
      icon: Images,
    },
    {
      title: "Portfólio & Galerias",
      value: `${stats.visibleProjectsCount} / ${stats.projectsCount}`,
      subtitle: "histórias publicadas na grade",
      href: "/admin/portfolio",
      action: "Controlar Fotos & Ordem",
      icon: FolderKanban,
    },
    {
      title: "Sobre & Textos",
      value: "FR · PT · EN",
      subtitle: "edição trilíngue em tempo real",
      href: "/admin/content",
      action: "Editar Textos & Biografia",
      icon: FileText,
    },
    {
      title: "Orçamentos Recebidos",
      value: String(stats.newInquiriesCount),
      subtitle: `${stats.totalInquiriesCount} solicitações no histórico`,
      href: "/admin/inquiries",
      action: "Abrir Caixa de Entrada",
      icon: Inbox,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E1DA]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#9E8765] mb-2">
            Visão Geral do Estúdio
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#181716]">
            Controle Visual &amp; Editorial
          </h1>
        </div>

        {/* Infrastructure Health Pills */}
        <div className="flex flex-wrap items-center gap-2.5 text-[10px] uppercase tracking-[0.18em]">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border ${
              stats.dbConnected
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {stats.dbConnected ? (
              <CheckCircle2 size={13} className="text-emerald-600" />
            ) : (
              <AlertCircle size={13} className="text-amber-600" />
            )}
            <span>Neon DB {stats.dbConnected ? "Ativo" : "Pendente"}</span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border ${
              stats.blobConnected
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {stats.blobConnected ? (
              <CheckCircle2 size={13} className="text-emerald-600" />
            ) : (
              <AlertCircle size={13} className="text-amber-600" />
            )}
            <span>
              Vercel Blob {stats.blobConnected ? "Ativo" : "Pendente"}
            </span>
          </span>
        </div>
      </div>

      {stats.dbConnected && <SeedInitializerBanner isSeeded={stats.isSeeded} />}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-white border border-[#E5E1DA] hover:border-[#9E8765] p-7 transition-all flex flex-col justify-between shadow-[0_4px_20px_rgba(24,23,22,0.02)]"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#6B6660]">
                    {card.title}
                  </span>
                  <Icon
                    size={18}
                    strokeWidth={1.5}
                    className="text-[#9E8765]"
                  />
                </div>
                <p className="font-serif text-3xl sm:text-4xl font-light text-[#181716]">
                  {card.value}
                </p>
                <p className="text-xs text-[#7A756E] font-light mt-1">
                  {card.subtitle}
                </p>
              </div>

              <div className="mt-7 pt-4 border-t border-[#F2EFE9] flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-[#181716] group-hover:text-[#9E8765] transition-colors">
                <span>{card.action}</span>
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Editorial Guide */}
      <div className="bg-white border border-[#E5E1DA] p-7 sm:p-8 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#9E8765] font-medium">
          Como Funciona a Atualização Instantânea
        </p>
        <p className="text-xs sm:text-sm text-[#59534B] font-light leading-relaxed">
          Toda alteração salva neste painel atualiza automaticamente o cache
          global do site público em menos de 1 segundo — sem precisar fazer novo
          deploy. Você pode arrastar e soltar fotos para mudar a sequência
          visual, clicar exatamente sobre o rosto dos noivos para ajustar o{" "}
          <strong>Ponto Focal</strong> no celular e ocultar temporariamente
          qualquer projeto com um clique.
        </p>
      </div>
    </div>
  );
}

