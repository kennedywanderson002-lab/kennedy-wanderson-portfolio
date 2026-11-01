"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { initializeCmsFromDefaultsAction } from "@/lib/cms/actions";

export function SeedInitializerBanner({ isSeeded }: { isSeeded: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSeeded && !done) return null;

  const handleImport = () => {
    setError(null);
    startTransition(async () => {
      try {
        await initializeCmsFromDefaultsAction();
        setDone(true);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao sincronizar dados iniciais."
        );
      }
    });
  };

  if (done) {
    return (
      <div className="mb-8 border border-emerald-200 bg-emerald-50/70 p-5 flex items-center gap-3 text-xs text-emerald-950">
        <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
        <span>
          Todas as fotografias, projetos e textos atuais do site foram
          sincronizados no banco de dados com sucesso!
        </span>
      </div>
    );
  }

  return (
    <div className="mb-8 border border-[#D8CBB8] bg-[#FAF6F0] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#9E8765] font-medium mb-1">
          Banco Conectado · Pronto para Sincronizar
        </p>
        <p className="text-xs sm:text-sm text-[#4A453E] font-light leading-relaxed max-w-2xl">
          O site está exibindo o catálogo estático padrão. Clique ao lado para
          copiar os 5 slides do Hero, os 13 ensaios do Portfólio e todos os
          textos (FR/PT/EN) para o banco e liberar edição imediata.
        </p>
        {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={handleImport}
        className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#181716] text-white hover:bg-[#9E8765] px-5 py-3 text-[10px] uppercase tracking-[0.25em] transition-colors cursor-pointer disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Importando...</span>
          </>
        ) : (
          <>
            <Sparkles size={14} />
            <span>Importar Catálogo Atual</span>
          </>
        )}
      </button>
    </div>
  );
}

