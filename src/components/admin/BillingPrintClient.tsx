"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import type { BillingDocumentItem } from "@/lib/cms/billing";
import { BillingA4DocumentSheet } from "./BillingA4DocumentSheet";

interface BillingPrintClientProps {
  document: BillingDocumentItem;
}

export function BillingPrintClient({ document: doc }: BillingPrintClientProps) {
  useEffect(() => {
    const cleanClient = doc.clientName
      .replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    const prefix = doc.docType === "facture" ? "Facture" : "Devis";
    window.document.title = `${prefix}-${doc.docNumber}-${cleanClient}`;
  }, [doc]);

  return (
    <div className="min-h-screen bg-[#EAE7E1] print:bg-white pb-12 print:pb-0">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            background: #FFFFFF !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Top Action Bar (Hidden when printing/saving to PDF) */}
      <div className="print:hidden sticky top-0 z-40 bg-[#181716] text-white px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/billing"
            className="inline-flex items-center gap-2 text-xs text-white/80 hover:text-white uppercase tracking-[0.2em]"
          >
            <ArrowLeft size={15} />
            <span>Voltar para Faturas &amp; Devis</span>
          </Link>
          <span className="text-white/25">|</span>
          <span className="font-serif italic text-base text-[#BFA989]">
            {doc.docNumber} · {doc.clientName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[11px] text-white/60">
            Dica: Na janela de impressão, escolha &ldquo;Salvar como PDF&rdquo; (Formato A4, Margens: Nenhuma)
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9E8765] hover:bg-white hover:text-[#181716] text-white text-[10px] uppercase tracking-[0.24em] font-medium transition-colors cursor-pointer"
          >
            <Printer size={14} />
            <span>Baixar / Imprimir PDF A4</span>
          </button>
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="pt-8 print:pt-0 flex justify-center">
        <BillingA4DocumentSheet
          docType={doc.docType}
          docNumber={doc.docNumber}
          clientName={doc.clientName}
          items={doc.items}
          discountAmount={doc.discountAmount}
          taxRate={doc.taxRate}
          fixedDepositAmount={doc.depositAmount}
          config={doc.documentConfig}
          printMode={true}
        />
      </div>
    </div>
  );
}

