"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Users,
  Sparkles,
  MessageCircle,
  Smartphone,
  Monitor,
  Globe,
  Share2,
  FolderKanban,
  Clock,
  RefreshCw,
} from "lucide-react";
import type {
  AdminAnalyticsSummary,
  AnalyticsRangeDays,
} from "@/lib/cms/analytics";

interface AnalyticsDashboardClientProps {
  summary: AdminAnalyticsSummary;
}

const RANGE_OPTIONS: { value: AnalyticsRangeDays; label: string }[] = [
  { value: 7, label: "Últimos 7 dias" },
  { value: 30, label: "Últimos 30 dias" },
  { value: 90, label: "Últimos 90 dias" },
  { value: 365, label: "Último ano" },
];

function formatEventLabel(type: string, projectTitle?: string): string {
  if (type === "project_open") {
    return projectTitle
      ? `Abriu a galeria "${projectTitle}"`
      : "Abriu uma história do portfólio";
  }
  if (type === "whatsapp_click") {
    return "Clicou para conversar no WhatsApp";
  }
  if (type === "inquiry_submit") {
    return "Enviou pedido de orçamento";
  }
  return "Visitou a página principal";
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function AnalyticsDashboardClient({
  summary,
}: AnalyticsDashboardClientProps) {
  const router = useRouter();

  const maxDailyViews = Math.max(
    ...summary.dailySeries.map((d) => d.pageviews),
    1
  );

  const handleRangeChange = (days: AnalyticsRangeDays) => {
    router.push(`/admin/analytics?days=${days}`);
  };

  return (
    <div className="space-y-8">
      {/* Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E1DA]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#9E8765] mb-2">
            Métricas &amp; Audiência em Tempo Real
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#181716]">
            Análise de Acessos &amp; Engajamento
          </h1>
          <p className="text-xs text-[#6B6660] font-light mt-1">
            Acompanhe visitantes, países, proporção entre celular e computador e
            quais histórias do seu portfólio mais despertam interesse.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex border border-[#D8D3CB] bg-white">
            {RANGE_OPTIONS.map((opt) => {
              const active = summary.rangeDays === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleRangeChange(opt.value)}
                  className={`px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] transition-colors cursor-pointer ${
                    active
                      ? "bg-[#181716] text-white"
                      : "text-[#6B6660] hover:text-[#181716]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => router.refresh()}
            title="Atualizar dados agora"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#D8D3CB] bg-white text-[10px] uppercase tracking-[0.18em] text-[#181716] hover:border-[#9E8765] hover:text-[#9E8765] transition-colors cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-[#E5E1DA] p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#6B6660]">
              Visualizações (Pageviews)
            </span>
            <Eye size={16} className="text-[#9E8765]" />
          </div>
          <p className="font-serif text-4xl font-light text-[#181716]">
            {summary.totalPageviews}
          </p>
          <p className="text-[11px] text-[#8C8780]">
            Hoje:{" "}
            <strong className="text-[#181716]">{summary.todayPageviews}</strong>{" "}
            acessos
          </p>
        </div>

        <div className="bg-white border border-[#E5E1DA] p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#6B6660]">
              Visitantes Únicos
            </span>
            <Users size={16} className="text-[#9E8765]" />
          </div>
          <p className="font-serif text-4xl font-light text-[#181716]">
            {summary.uniqueVisitors}
          </p>
          <p className="text-[11px] text-[#8C8780]">
            Hoje:{" "}
            <strong className="text-[#181716]">
              {summary.todayUniqueVisitors}
            </strong>{" "}
            pessoas
          </p>
        </div>

        <div className="bg-white border border-[#E5E1DA] p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#6B6660]">
              Galerias Abertas
            </span>
            <Sparkles size={16} className="text-[#9E8765]" />
          </div>
          <p className="font-serif text-4xl font-light text-[#181716]">
            {summary.projectOpens}
          </p>
          <p className="text-[11px] text-[#8C8780]">
            Cliques em histórias do portfólio
          </p>
        </div>

        <div className="bg-white border border-[#E5E1DA] p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#6B6660]">
              Conversões &amp; Contato
            </span>
            <MessageCircle size={16} className="text-[#9E8765]" />
          </div>
          <p className="font-serif text-4xl font-light text-[#181716]">
            {summary.whatsappClicks + summary.inquirySubmits}
          </p>
          <p className="text-[11px] text-[#8C8780]">
            {summary.whatsappClicks} WhatsApp · {summary.inquirySubmits}{" "}
            Orçamentos
          </p>
        </div>
      </div>

      {/* Daily Traffic Evolution Bar Chart */}
      <div className="bg-white border border-[#E5E1DA] p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#9E8765] font-medium">
              Evolução Diária de Visitas
            </p>
            <h2 className="font-serif text-2xl font-light text-[#181716]">
              Acessos Dia a Dia
            </h2>
          </div>
          <span className="text-[11px] text-[#8C8780]">
            Passe o mouse sobre as colunas para ver detalhes do dia
          </span>
        </div>

        <div className="h-52 flex items-end gap-1.5 sm:gap-2.5 pt-6 pb-2 border-b border-[#EFECE6]">
          {summary.dailySeries.map((day) => {
            const heightPct =
              day.pageviews > 0
                ? Math.max(Math.round((day.pageviews / maxDailyViews) * 100), 8)
                : 3;

            return (
              <div
                key={day.dateKey}
                title={`${day.label}: ${day.pageviews} visualizações (${day.uniqueVisitors} visitantes únicos)`}
                className="flex-1 flex flex-col items-center justify-end h-full group"
              >
                <span className="text-[9px] font-mono text-[#6B6660] opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                  {day.pageviews}
                </span>
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full transition-all duration-300 ${
                    day.pageviews > 0
                      ? "bg-[#181716] group-hover:bg-[#9E8765]"
                      : "bg-[#EFECE6]"
                  }`}
                />
                <span className="text-[8px] sm:text-[9px] font-mono text-[#8C8780] mt-2 truncate max-w-full">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2: Devices (Celular vs PC) & Languages (FR / PT / EN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Devices Breakdown */}
        <div className="bg-white border border-[#E5E1DA] p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#9E8765]">
                Dispositivos Utilizados
              </p>
              <h3 className="font-serif text-2xl font-light text-[#181716]">
                Celular vs Computador (PC)
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[#9E8765]">
              <Smartphone size={16} />
              <Monitor size={16} />
            </div>
          </div>

          {summary.devices.length === 0 ? (
            <p className="text-xs text-[#8C8780] font-light py-6">
              Aguardando os primeiros acessos registrados neste período.
            </p>
          ) : (
            <div className="space-y-4">
              {summary.devices.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#181716] font-medium">
                      {item.label}
                    </span>
                    <span className="font-mono text-[#6B6660]">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F2EFE9] overflow-hidden">
                    <div
                      style={{ width: `${Math.max(item.percentage, 3)}%` }}
                      className="h-full bg-[#181716]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Languages Breakdown */}
        <div className="bg-white border border-[#E5E1DA] p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#9E8765]">
                Idioma de Navegação
              </p>
              <h3 className="font-serif text-2xl font-light text-[#181716]">
                Français · Português · English
              </h3>
            </div>
            <Globe size={17} className="text-[#9E8765]" />
          </div>

          {summary.locales.length === 0 ? (
            <p className="text-xs text-[#8C8780] font-light py-6">
              Aguardando os primeiros acessos registrados neste período.
            </p>
          ) : (
            <div className="space-y-4">
              {summary.locales.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#181716] font-medium">
                      {item.label}
                    </span>
                    <span className="font-mono text-[#6B6660]">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F2EFE9] overflow-hidden">
                    <div
                      style={{ width: `${Math.max(item.percentage, 3)}%` }}
                      className="h-full bg-[#9E8765]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Countries/Cities & Traffic Sources (Instagram, Google, Direct) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Countries & Cities */}
        <div className="bg-white border border-[#E5E1DA] p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#9E8765]">
                Geolocalização dos Visitantes
              </p>
              <h3 className="font-serif text-2xl font-light text-[#181716]">
                Países &amp; Cidades Principais
              </h3>
            </div>
            <Globe size={17} className="text-[#9E8765]" />
          </div>

          {summary.countries.length === 0 ? (
            <p className="text-xs text-[#8C8780] font-light py-4">
              Nenhum país registrado ainda neste período.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.countries.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 border-b border-[#F2EFE9] text-xs"
                >
                  <span className="text-[#181716]">{item.label}</span>
                  <span className="font-mono text-[#6B6660]">
                    {item.count} acesso{item.count === 1 ? "" : "s"} (
                    {item.percentage}%)
                  </span>
                </div>
              ))}

              {summary.cities.length > 0 && (
                <div className="pt-3">
                  <p className="text-[9px] uppercase tracking-[0.22em] text-[#8C8780] mb-2">
                    Cidades Identificadas:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.cities.map((c) => (
                      <span
                        key={c.label}
                        className="px-2.5 py-1 bg-[#FAF9F6] border border-[#E5E1DA] text-[10px] text-[#4A453E]"
                      >
                        {c.label} · <strong>{c.count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Traffic Sources / Referrers */}
        <div className="bg-white border border-[#E5E1DA] p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#9E8765]">
                Canais de Aquisição
              </p>
              <h3 className="font-serif text-2xl font-light text-[#181716]">
                De Onde Vêm os Clientes
              </h3>
            </div>
            <Share2 size={17} className="text-[#9E8765]" />
          </div>

          {summary.referrers.length === 0 ? (
            <p className="text-xs text-[#8C8780] font-light py-4">
              Nenhuma origem registrada ainda neste período.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.referrers.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 border-b border-[#F2EFE9] text-xs"
                >
                  <span className="text-[#181716] font-medium">
                    {item.label}
                  </span>
                  <span className="font-mono text-[#6B6660]">
                    {item.count} visita{item.count === 1 ? "" : "s"} (
                    {item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Most Viewed Portfolio Projects & Recent Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Portfolio Stories */}
        <div className="lg:col-span-6 bg-white border border-[#E5E1DA] p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#9E8765]">
                Curadoria &amp; Interesse
              </p>
              <h3 className="font-serif text-2xl font-light text-[#181716]">
                Histórias Mais Abertas na Galeria
              </h3>
            </div>
            <FolderKanban size={17} className="text-[#9E8765]" />
          </div>

          {summary.topProjects.length === 0 ? (
            <p className="text-xs text-[#8C8780] font-light py-6">
              Assim que os visitantes clicarem nas fotos do portfólio para abrir
              o Lightbox, as histórias mais vistas aparecerão listadas aqui.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.topProjects.map((proj, idx) => (
                <div
                  key={proj.projectId}
                  className="flex items-center justify-between py-2.5 border-b border-[#F2EFE9] gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-[#9E8765]">
                      #{idx + 1}
                    </span>
                    <span className="font-serif italic text-lg text-[#181716] truncate">
                      {proj.projectTitle}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-mono text-xs text-[#181716] font-medium">
                      {proj.opens} abertura{proj.opens === 1 ? "" : "s"}
                    </span>
                    <span className="block text-[10px] text-[#8C8780]">
                      {proj.uniqueViewers} visitante
                      {proj.uniqueViewers === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Recent Events Log */}
        <div className="lg:col-span-6 bg-white border border-[#E5E1DA] p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#9E8765]">
                Fluxo em Tempo Real
              </p>
              <h3 className="font-serif text-2xl font-light text-[#181716]">
                Últimas Interações no Site
              </h3>
            </div>
            <Clock size={17} className="text-[#9E8765]" />
          </div>

          {summary.recentEvents.length === 0 ? (
            <p className="text-xs text-[#8C8780] font-light py-6">
              Nenhuma atividade registrada ainda.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {summary.recentEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 bg-[#FAF9F6] border border-[#EFECE6] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="text-[#181716] font-medium truncate">
                      {formatEventLabel(ev.eventType, ev.projectTitle)}
                    </p>
                    <p className="text-[10px] text-[#8C8780] truncate mt-0.5">
                      {ev.deviceType === "mobile"
                        ? "📱 Celular"
                        : "🖥️ Computador"}{" "}
                      · {ev.locale.toUpperCase()} ·{" "}
                      {ev.city ? `${ev.city}, ${ev.country}` : ev.country} ·{" "}
                      {ev.referrerSource}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-[#8C8780] shrink-0">
                    {formatRelativeTime(ev.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

