"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  MessageCircle,
  Calendar,
  MapPin,
  Users,
  Check,
  Archive,
  Trash2,
  X,
  Inbox,
} from "lucide-react";
import type { CmsInquiryItem } from "@/lib/cms/types";
import {
  updateInquiryStatusAction,
  deleteInquiryAction,
} from "@/lib/cms/actions";

interface InquiriesInboxClientProps {
  initialInquiries: CmsInquiryItem[];
}

export function InquiriesInboxClient({
  initialInquiries,
}: InquiriesInboxClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<CmsInquiryItem[]>(initialInquiries);
  const [filter, setFilter] = useState<
    "all" | "new" | "contacted" | "archived"
  >("all");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  const handleStatusUpdate = (
    item: CmsInquiryItem,
    nextStatus: "new" | "contacted" | "archived"
  ) => {
    const notes = notesDraft[item.id] ?? item.notes;
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: nextStatus, notes } : i
      )
    );
    startTransition(async () => {
      await updateInquiryStatusAction(item.id, nextStatus, notes);
      router.refresh();
    });
  };

  const handleSaveNotes = (item: CmsInquiryItem) => {
    const notes = notesDraft[item.id] ?? item.notes;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, notes } : i))
    );
    startTransition(async () => {
      await updateInquiryStatusAction(item.id, item.status, notes);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteInquiryAction(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setConfirmDeleteId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-[#E5E1DA]">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#9E8765] mb-2">
          Solicitações de Casais &amp; Clientes
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#181716]">
          Caixa de Orçamentos
        </h1>
        <p className="text-xs text-[#6B6660] font-light mt-1">
          Todas as mensagens enviadas pelo formulário público do site ficam
          registradas aqui com segurança.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", `Todas (${items.length})`],
            [
              "new",
              `Novas (${items.filter((i) => i.status === "new").length})`,
            ],
            [
              "contacted",
              `Respondidas (${
                items.filter((i) => i.status === "contacted").length
              })`,
            ],
            [
              "archived",
              `Arquivadas (${
                items.filter((i) => i.status === "archived").length
              })`,
            ],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] border transition-colors cursor-pointer ${
              filter === id
                ? "bg-[#181716] text-white border-[#181716]"
                : "bg-white text-[#6B6660] border-[#E5E1DA] hover:border-[#181716]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] p-14 text-center space-y-3">
          <Inbox size={28} className="text-[#9E8765] mx-auto" strokeWidth={1.3} />
          <p className="font-serif italic text-xl text-[#181716]">
            Nenhuma solicitação nesta categoria no momento.
          </p>
          <p className="text-xs text-[#8C8780] font-light">
            Assim que um casal enviar o formulário de disponibilidade, ele
            aparecerá instantaneamente aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((item) => {
            const cleanDigits = item.phone.replace(/[^\d]/g, "");
            const waHref =
              cleanDigits.length >= 8
                ? `https://wa.me/${cleanDigits}?text=${encodeURIComponent(
                    `Bonjour ${item.fullName}, merci pour votre message concernant votre événement (${item.eventDate}).`
                  )}`
                : null;

            return (
              <div
                key={item.id}
                className="bg-white border border-[#E5E1DA] p-6 sm:p-8 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#F2EFE9]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] border ${
                          item.status === "new"
                            ? "bg-amber-50 text-amber-900 border-amber-200 font-medium"
                            : item.status === "contacted"
                            ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                            : "bg-[#FAF9F6] text-[#8C8780] border-[#E5E1DA]"
                        }`}
                      >
                        {item.status === "new"
                          ? "Nova Solicitação"
                          : item.status === "contacted"
                          ? "Respondida"
                          : "Arquivada"}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#9C968F]">
                        Idioma: {item.locale.toUpperCase()} ·{" "}
                        {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    <h2 className="font-serif text-2xl text-[#181716]">
                      {item.fullName}
                    </h2>
                  </div>

                  {/* Direct Reply Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${item.email}?subject=${encodeURIComponent(
                        `Kennedy Wanderson Photography · ${item.eventDate}`
                      )}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#181716] text-white hover:bg-[#9E8765] text-[10px] uppercase tracking-[0.2em] transition-colors"
                    >
                      <Mail size={13} />
                      <span>Responder E-mail</span>
                    </a>

                    {waHref && (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#181716] text-[#181716] hover:bg-[#181716] hover:text-white text-[10px] uppercase tracking-[0.2em] transition-colors"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Event Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#59534B] bg-[#FAF9F6] p-4 border border-[#EFECE6]">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#9E8765] shrink-0" />
                    <span>
                      <strong>Data:</strong> {item.eventDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#9E8765] shrink-0" />
                    <span>
                      <strong>Destino:</strong> {item.destination || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-[#9E8765] shrink-0" />
                    <span>
                      <strong>Convidados:</strong> {item.guestCount || "—"}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[#6B6660] flex flex-wrap gap-x-6 gap-y-1">
                  <span>
                    <strong>E-mail:</strong> {item.email}
                  </span>
                  {item.phone && (
                    <span>
                      <strong>Telefone:</strong> {item.phone}
                    </span>
                  )}
                </div>

                {/* Client Message */}
                <p className="text-sm text-[#181716] font-light leading-relaxed whitespace-pre-line border-l-2 border-[#9E8765] pl-4">
                  {item.message}
                </p>

                {/* Internal Notes & Status Controls */}
                <div className="pt-4 border-t border-[#F2EFE9] flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="flex-1">
                    <label className="block text-[9px] uppercase tracking-[0.22em] text-[#8C8780] mb-1">
                      Anotações Internas (Visível apenas para você)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={notesDraft[item.id] ?? item.notes}
                        onChange={(e) =>
                          setNotesDraft({
                            ...notesDraft,
                            [item.id]: e.target.value,
                          })
                        }
                        placeholder="ex: Orçamento enviado em PDF..."
                        className="flex-1 border border-[#D8D3CB] bg-[#FAF9F6] px-3 py-2 text-xs text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                      />
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleSaveNotes(item)}
                        className="px-3.5 py-2 border border-[#D8D3CB] text-[10px] uppercase tracking-[0.18em] text-[#181716] hover:border-[#181716] cursor-pointer"
                      >
                        Salvar Nota
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status !== "contacted" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusUpdate(item, "contacted")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-emerald-200 bg-emerald-50 text-emerald-900 text-[10px] uppercase tracking-[0.18em] cursor-pointer"
                      >
                        <Check size={12} />
                        <span>Marcar Respondida</span>
                      </button>
                    )}

                    {item.status !== "archived" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusUpdate(item, "archived")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E5E1DA] text-[#6B6660] hover:text-[#181716] text-[10px] uppercase tracking-[0.18em] cursor-pointer"
                      >
                        <Archive size={12} />
                        <span>Arquivar</span>
                      </button>
                    )}

                    {confirmDeleteId === item.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-2 bg-red-700 text-white text-[10px] uppercase tracking-[0.18em] cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-2 text-[#6B6660] cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        aria-label="Excluir solicitação"
                        className="p-2 border border-[#E5E1DA] text-[#8C8780] hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

