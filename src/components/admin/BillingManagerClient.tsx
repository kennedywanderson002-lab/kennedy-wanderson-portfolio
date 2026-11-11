"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Printer,
  Copy,
  Trash2,
  ArrowRightLeft,
  Check,
  Settings2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Save,
  Eye,
  Search,
  Euro,
  Clock,
  CheckCircle2,
  FileCheck2,
  X,
} from "lucide-react";
import type {
  BillingDefaultSettingsJson,
  BillingDocumentConfig,
  BillingLineItem,
} from "@/db/schema";
import {
  applyLanguagePresetToConfig,
  buildDefaultDocumentConfig,
  calculateBillingTotals,
  formatCurrencyFR,
  PHOTOGRAPHY_SERVICE_PRESETS,
  type BillingDashboardSummary,
  type BillingDocStatus,
  type BillingDocType,
  type BillingDocumentItem,
} from "@/lib/cms/billing";
import {
  convertDevisToFactureAction,
  deleteBillingDocumentAction,
  saveBillingDocumentAction,
  saveBillingSettingsAction,
  updateBillingDocumentStatusAction,
} from "@/lib/cms/actions";
import {
  BillingA4DocumentSheet,
  type BillingEditorZone,
} from "./BillingA4DocumentSheet";

export interface InitialInquiryDraft {
  inquiryId?: string;
  docType?: BillingDocType;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  eventDate?: string;
  eventLocation?: string;
  guestCount?: string;
}

interface BillingManagerClientProps {
  initialData: BillingDashboardSummary;
  initialInquiryDraft?: InitialInquiryDraft | null;
}

let clientLineItemSeq = 100;
function nextClientLineItemId(): string {
  clientLineItemSeq += 1;
  return `item-local-${clientLineItemSeq}`;
}

const STATUS_LABELS: Record<
  BillingDocStatus,
  { label: string; badgeClass: string }
> = {
  draft: {
    label: "Rascunho",
    badgeClass: "bg-[#FAF9F6] text-[#6B6660] border-[#D8D3CB]",
  },
  sent: {
    label: "Enviado ao Cliente",
    badgeClass: "bg-blue-50 text-blue-900 border-blue-200",
  },
  accepted: {
    label: "Devis Aceito",
    badgeClass: "bg-indigo-50 text-indigo-900 border-indigo-200",
  },
  deposit_paid: {
    label: "Sinal Pago (Acompte)",
    badgeClass: "bg-amber-50 text-amber-900 border-amber-200",
  },
  paid: {
    label: "100% Quitado",
    badgeClass: "bg-emerald-50 text-emerald-900 border-emerald-200",
  },
  cancelled: {
    label: "Cancelado",
    badgeClass: "bg-red-50 text-red-800 border-red-200",
  },
};

const EDITOR_SECTIONS: Array<{
  id: BillingEditorZone;
  number: string;
  title: string;
  subtitle: string;
}> = [
  {
    id: "identity",
    number: "01",
    title: "Tipo, Número & Selo de Status",
    subtitle: "Etiqueta FACTURE/DEVIS, numeração e badge superior direito",
  },
  {
    id: "client",
    number: "02",
    title: "Cliente / Casal (Facturé à)",
    subtitle: "Nome dos noivos, endereço, e-mail, telefone e linha extra",
  },
  {
    id: "event",
    number: "03",
    title: "Faixa do Evento (4 Colunas)",
    subtitle: "Títulos e valores de data de emissão, casamento, local e prazo",
  },
  {
    id: "items",
    number: "04",
    title: "Serviços & Pacotes Fotográficos",
    subtitle: "Cabeçalhos da tabela, pacotes rápidos, descrições e preços",
  },
  {
    id: "totals",
    number: "05",
    title: "Totais, Desconto, TVA & Sinal (Acompte)",
    subtitle: "Cálculo de impostos, sinal de 30% ou valor fixo e saldo a pagar",
  },
  {
    id: "payment",
    number: "06",
    title: "Dados Bancários SEPA & Condições",
    subtitle: "IBAN, BIC, banco, cronograma de reserva e condições",
  },
  {
    id: "emitter",
    number: "07",
    title: "Cabeçalho da Marca & Dados do Fotógrafo",
    subtitle: "Título do estúdio, nome, SIRET, Code APE e contatos nesta fatura",
  },
  {
    id: "signatures",
    number: "08",
    title: "Quadro de Assinaturas (Bon pour Accord)",
    subtitle: "Ativar/ocultar assinaturas do fotógrafo e dos noivos",
  },
  {
    id: "footer",
    number: "09",
    title: "Rodapé Legal (Pé da Página A4)",
    subtitle: "Cláusulas legais francesas e identificação de rodapé",
  },
];

export function BillingManagerClient({
  initialData,
  initialInquiryDraft,
}: BillingManagerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [settings, setSettings] = useState<BillingDefaultSettingsJson>(
    initialData.settings
  );
  const [documents, setDocuments] = useState<BillingDocumentItem[]>(
    initialData.documents
  );

  // Main View Tab: "list" | "editor" | "settings"
  const [activeTab, setActiveTab] = useState<"list" | "editor" | "settings">(
    initialInquiryDraft ? "editor" : "list"
  );

  // Filters on List Tab
  const [filterType, setFilterType] = useState<"all" | "facture" | "devis">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to generate next sequential document number
  const getNextDocNumber = (
    type: BillingDocType,
    s: BillingDefaultSettingsJson = settings
  ) => {
    const year = new Date().getFullYear();
    if (type === "facture") {
      const seq = String(s.nextInvoiceSeq || 1).padStart(3, "0");
      return `${s.invoicePrefix || "FAC"}-${year}-${seq}`;
    }
    const seq = String(s.nextDevisSeq || 1).padStart(3, "0");
    return `${s.devisPrefix || "DEV"}-${year}-${seq}`;
  };

  // Build initial editor state (either from inquiry draft or default)
  const buildNewEditorDraft = (
    type: BillingDocType,
    inquiry?: InitialInquiryDraft | null
  ) => {
    const num = getNextDocNumber(type, settings);
    const cfg = buildDefaultDocumentConfig(type, num, settings, {
      clientAddressLine1: inquiry?.eventLocation || "Paris, France",
      clientAddressLine2: "",
      clientEmailLine: inquiry?.clientEmail
        ? `E-mail : ${inquiry.clientEmail}`
        : "E-mail : client@email.fr",
      clientPhoneLine: inquiry?.clientPhone
        ? `Tél : ${inquiry.clientPhone}`
        : "",
      clientExtraLine: inquiry?.guestCount
        ? `Invités prévus : ${inquiry.guestCount}`
        : "",
      metaCol2Value: inquiry?.eventDate || "À définir",
      metaCol3Value: inquiry?.eventLocation || "France",
    });

    const defaultItems: BillingLineItem[] = [
      {
        id: "item-default-1",
        ...PHOTOGRAPHY_SERVICE_PRESETS[0],
      },
    ];

    return {
      id: undefined as string | undefined,
      docType: type,
      docNumber: num,
      status: "draft" as BillingDocStatus,
      inquiryId: inquiry?.inquiryId || "",
      clientName: inquiry?.clientName || "Camille Laurent & Julien Moreau",
      clientEmail: inquiry?.clientEmail || "",
      clientPhone: inquiry?.clientPhone || "",
      eventDate: inquiry?.eventDate || "19 Juin 2027",
      eventLocation: inquiry?.eventLocation || "Château de Santeny, France",
      discountAmount: 0,
      taxRate: settings.defaultTaxRate || 0,
      fixedDepositAmount: 1020,
      items: defaultItems,
      documentConfig: cfg,
      notes: "",
    };
  };

  // Editor State
  const [editorState, setEditorState] = useState(() =>
    buildNewEditorDraft(
      initialInquiryDraft?.docType || "devis",
      initialInquiryDraft
    )
  );
  const [activeZone, setActiveZone] = useState<BillingEditorZone>("client");
  const [mobileEditorView, setMobileEditorView] = useState<"form" | "preview">(
    "form"
  );

  // Open a new blank document in Editor
  const handleStartNewDocument = (type: BillingDocType) => {
    setEditorState(buildNewEditorDraft(type, null));
    setActiveZone("client");
    setActiveTab("editor");
  };

  // Open an existing document in Editor
  const handleEditDocument = (doc: BillingDocumentItem) => {
    setEditorState({
      id: doc.id,
      docType: doc.docType,
      docNumber: doc.docNumber,
      status: doc.status,
      inquiryId: doc.inquiryId,
      clientName: doc.clientName,
      clientEmail: doc.clientEmail,
      clientPhone: doc.clientPhone,
      eventDate: doc.eventDate,
      eventLocation: doc.eventLocation,
      discountAmount: doc.discountAmount,
      taxRate: doc.taxRate,
      fixedDepositAmount: doc.depositAmount,
      items: doc.items.map((i) => ({ ...i })),
      documentConfig: { ...doc.documentConfig },
      notes: doc.notes,
    });
    setActiveZone("client");
    setActiveTab("editor");
  };

  // Duplicate an existing document
  const handleDuplicateDocument = (doc: BillingDocumentItem) => {
    const nextNum = getNextDocNumber(doc.docType, settings);
    setEditorState({
      id: undefined,
      docType: doc.docType,
      docNumber: nextNum,
      status: "draft",
      inquiryId: doc.inquiryId,
      clientName: doc.clientName,
      clientEmail: doc.clientEmail,
      clientPhone: doc.clientPhone,
      eventDate: doc.eventDate,
      eventLocation: doc.eventLocation,
      discountAmount: doc.discountAmount,
      taxRate: doc.taxRate,
      fixedDepositAmount: doc.depositAmount,
      items: doc.items.map((i, idx) => ({
        ...i,
        id: `item-copy-${idx + 1}`,
      })),
      documentConfig: {
        ...doc.documentConfig,
      },
      notes: doc.notes,
    });
    setActiveZone("identity");
    setActiveTab("editor");
    showToast(`Cópia criada com o número ${nextNum}. Revise e clique em Salvar.`);
  };

  // Switch docType inside the editor (Devis <-> Facture)
  const handleSwitchEditorDocType = (newType: BillingDocType) => {
    if (newType === editorState.docType) return;
    const isDevis = newType === "devis";
    const nextNum = !editorState.id
      ? getNextDocNumber(newType, settings)
      : editorState.docNumber;

    setEditorState((prev) => ({
      ...prev,
      docType: newType,
      docNumber: nextNum,
      documentConfig: {
        ...prev.documentConfig,
        docBadgeLabel: isDevis ? "Devis / Proposition" : "Facture",
        docStatusBadge: isDevis
          ? "Valable 30 jours à compter de l'émission"
          : `Acompte ${prev.documentConfig.depositPercent}% Réglé · Solde à Échéance`,
        emitterSectionLabel: isDevis
          ? "Prestataire / Photographe"
          : "Prestataire / Émetteur",
        clientSectionLabel: isDevis
          ? "Proposition Préparée Pour"
          : "Facturé à / Client",
        metaCol1Label: isDevis ? "Date du Devis" : "Date d'émission",
        metaCol4Label: isDevis ? "Validité de l'offre" : "Échéance de règlement",
        grandTotalLabel: isDevis ? "Total Devis TTC" : "Total Net TTC",
        depositLabel: isDevis
          ? `Acompte à la réservation (${prev.documentConfig.depositPercent} %)`
          : `Acompte versé (${prev.documentConfig.depositPercent} %)`,
        deductDepositFromTotal: !isDevis,
        showBalanceDue: !isDevis,
        showSignatures: isDevis,
        footerLine1: isDevis
          ? settings.defaultDevisFooter1
          : settings.defaultInvoiceFooter1,
        footerLine2: isDevis
          ? settings.defaultDevisFooter2
          : settings.defaultInvoiceFooter2,
      },
    }));
  };

  // Update a single key in documentConfig
  const updateConfig = <K extends keyof BillingDocumentConfig>(
    key: K,
    value: BillingDocumentConfig[K]
  ) => {
    setEditorState((prev) => ({
      ...prev,
      documentConfig: {
        ...prev.documentConfig,
        [key]: value,
      },
    }));
  };

  // Line Items Management
  const handleAddLineItem = (preset?: Omit<BillingLineItem, "id">) => {
    const newId = nextClientLineItemId();
    const newItem: BillingLineItem = preset
      ? { id: newId, ...preset }
      : {
          id: newId,
          title: "Nouvelle Prestation Photographique",
          description: "Description détaillée de la prestation...",
          quantityLabel: "1 Forfait",
          quantity: 1,
          unitPrice: 500,
        };

    setEditorState((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleUpdateLineItem = (
    id: string,
    patch: Partial<BillingLineItem>
  ) => {
    setEditorState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

  const handleMoveLineItem = (index: number, direction: -1 | 1) => {
    setEditorState((prev) => {
      const next = [...prev.items];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return { ...prev, items: next };
    });
  };

  const handleRemoveLineItem = (id: string) => {
    setEditorState((prev) => ({
      ...prev,
      items:
        prev.items.length > 1
          ? prev.items.filter((i) => i.id !== id)
          : prev.items,
    }));
  };

  // Save Document Action
  const handleSaveDocument = (openPrintAfterSave = false) => {
    startTransition(async () => {
      const res = await saveBillingDocumentAction({
        id: editorState.id,
        docType: editorState.docType,
        docNumber: editorState.docNumber,
        status: editorState.status,
        inquiryId: editorState.inquiryId,
        clientName: editorState.clientName,
        clientEmail: editorState.clientEmail,
        clientPhone: editorState.clientPhone,
        eventDate: editorState. documentConfig.metaCol2Value,
        eventLocation: editorState.documentConfig.metaCol3Value,
        discountAmount: editorState.discountAmount,
        taxRate: editorState.taxRate,
        fixedDepositAmount: editorState.fixedDepositAmount,
        items: editorState.items,
        documentConfig: editorState.documentConfig,
        notes: editorState.notes,
      });

      if (res.ok && res.id) {
        const totals = calculateBillingTotals(
          editorState.items,
          editorState.discountAmount,
          editorState.taxRate,
          editorState.documentConfig,
          editorState.fixedDepositAmount
        );

        const savedDoc: BillingDocumentItem = {
          id: res.id,
          docType: editorState.docType,
          docNumber: editorState.docNumber,
          status: editorState.status,
          inquiryId: editorState.inquiryId || "",
          clientName: editorState.clientName,
          clientEmail: editorState.clientEmail || "",
          clientPhone: editorState.clientPhone || "",
          eventDate: editorState.documentConfig.metaCol2Value,
          eventLocation: editorState.documentConfig.metaCol3Value,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxRate: editorState.taxRate,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          depositAmount: totals.depositAmount,
          balanceDue: totals.balanceDue,
          items: editorState.items,
          documentConfig: editorState.documentConfig,
          notes: editorState.notes || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setEditorState((prev) => ({ ...prev, id: res.id }));
        setDocuments((prev) => {
          const exists = prev.some((d) => d.id === res.id);
          if (exists) {
            return prev.map((d) => (d.id === res.id ? savedDoc : d));
          }
          return [savedDoc, ...prev];
        });

        showToast(
          `${
            editorState.docType === "facture" ? "Fatura" : "Devis"
          } ${editorState.docNumber} salvo com sucesso!`
        );
        router.refresh();

        if (openPrintAfterSave) {
          window.open(`/admin/billing-print/${res.id}`, "_blank");
        }
      }
    });
  };

  // Quick Status Change from List
  const handleQuickStatusChange = (id: string, nextStatus: BillingDocStatus) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: nextStatus } : d))
    );
    startTransition(async () => {
      await updateBillingDocumentStatusAction(id, nextStatus);
      showToast("Status atualizado.");
      router.refresh();
    });
  };

  // Convert Devis -> Facture with 1 click
  const handleConvertToFacture = (devis: BillingDocumentItem) => {
    startTransition(async () => {
      const res = await convertDevisToFactureAction(devis.id);
      if (res.ok) {
        showToast(
          `Devis ${devis.docNumber} convertido na Fatura ${res.docNumber}!`
        );
        router.refresh();
        window.location.reload();
      }
    });
  };

  // Delete Document
  const handleDeleteDocument = (id: string) => {
    startTransition(async () => {
      await deleteBillingDocumentAction(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setConfirmDeleteId(null);
      showToast("Documento excluído.");
      router.refresh();
    });
  };

  // Save Global Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await saveBillingSettingsAction(settings);
      showToast("Configurações fiscais e bancárias padrão salvas!");
      router.refresh();
    });
  };

  // Filtered Documents
  const filteredDocs = documents.filter((doc) => {
    if (filterType !== "all" && doc.docType !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.clientName.toLowerCase().includes(q) ||
        doc.docNumber.toLowerCase().includes(q) ||
        doc.eventLocation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Live Calculated Totals for the Editor
  const liveTotals = calculateBillingTotals(
    editorState.items,
    editorState.discountAmount,
    editorState.taxRate,
    editorState.documentConfig,
    editorState.fixedDepositAmount
  );

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#181716] text-white px-5 py-3.5 shadow-xl border border-[#9E8765]">
          <CheckCircle2 size={16} className="text-[#BFA989] shrink-0" />
          <span className="text-xs tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-[#E5E1DA]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#9E8765] mb-2">
            Gestão Financeira &amp; Propostas Fine Art
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#181716]">
            Faturas (*Factures*) &amp; Orçamentos (*Devis*)
          </h1>
          <p className="text-xs text-[#6B6660] font-light mt-1">
            Crie propostas com assinatura e faturas oficiais francesas 100%
            editáveis com exportação nativa para PDF A4.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] border transition-colors cursor-pointer ${
              activeTab === "list"
                ? "bg-[#181716] text-white border-[#181716]"
                : "bg-white text-[#181716] border-[#D8D3CB] hover:border-[#181716]"
            }`}
          >
            <FileText size={14} />
            <span>Documentos ({documents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] border transition-colors cursor-pointer ${
              activeTab === "editor"
                ? "bg-[#9E8765] text-white border-[#9E8765]"
                : "bg-white text-[#181716] border-[#D8D3CB] hover:border-[#181716]"
            }`}
          >
            <Sparkles size={14} />
            <span>
              {editorState.id
                ? `Editando ${editorState.docNumber}`
                : "Editor A4 Ao Vivo"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] border transition-colors cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#181716] text-white border-[#181716]"
                : "bg-white text-[#6B6660] border-[#D8D3CB] hover:border-[#181716]"
            }`}
          >
            <Settings2 size={14} />
            <span>Meus Dados Fiscais &amp; IBAN</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: DOCUMENTS LIST & FINANCIAL KPIS                              */}
      {/* =================================================================== */}
      {activeTab === "list" && (
        <div className="space-y-8">
          {/* Financial KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E5E1DA] p-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-[#7A756E] mb-2">
                <span>Total Faturado</span>
                <Euro size={15} className="text-[#9E8765]" />
              </div>
              <p className="font-serif text-2xl sm:text-3xl text-[#181716]">
                {formatCurrencyFR(
                  initialData.kpis.totalInvoiced,
                  settings.currencySymbol
                )}
              </p>
              <p className="text-[11px] text-[#8C8780] font-light mt-1">
                Soma das faturas ativas emitidas
              </p>
            </div>

            <div className="bg-white border border-[#E5E1DA] p-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-[#7A756E] mb-2">
                <span>Recebido (Sinais + Quitados)</span>
                <CheckCircle2 size={15} className="text-emerald-600" />
              </div>
              <p className="font-serif text-2xl sm:text-3xl text-[#181716]">
                {formatCurrencyFR(
                  initialData.kpis.totalDepositsReceived,
                  settings.currencySymbol
                )}
              </p>
              <p className="text-[11px] text-[#8C8780] font-light mt-1">
                Acomptes e faturas pagas
              </p>
            </div>

            <div className="bg-white border border-[#E5E1DA] p-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-[#7A756E] mb-2">
                <span>Saldo a Receber (Solde)</span>
                <Clock size={15} className="text-amber-600" />
              </div>
              <p className="font-serif text-2xl sm:text-3xl text-[#181716]">
                {formatCurrencyFR(
                  initialData.kpis.totalBalancePending,
                  settings.currencySymbol
                )}
              </p>
              <p className="text-[11px] text-[#8C8780] font-light mt-1">
                Restante a receber antes dos eventos
              </p>
            </div>

            <div className="bg-white border border-[#E5E1DA] p-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-[#7A756E] mb-2">
                <span>Devis em Aberto</span>
                <FileCheck2 size={15} className="text-[#9E8765]" />
              </div>
              <p className="font-serif text-2xl sm:text-3xl text-[#181716]">
                {initialData.kpis.openDevisCount}{" "}
                <span className="text-base text-[#8C8780]">
                  (
                  {formatCurrencyFR(
                    initialData.kpis.totalDevisValue,
                    settings.currencySymbol
                  )}
                  )
                </span>
              </p>
              <p className="text-[11px] text-[#8C8780] font-light mt-1">
                Propostas aguardando assinatura
              </p>
            </div>
          </div>

          {/* Action Bar: Create New + Filter + Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E5E1DA] p-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleStartNewDocument("devis")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#9E8765] text-white hover:bg-[#181716] text-[10px] uppercase tracking-[0.22em] transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Novo Orçamento (Devis)</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartNewDocument("facture")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#181716] text-white hover:bg-[#9E8765] text-[10px] uppercase tracking-[0.22em] transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Nova Fatura (Facture)</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  ["all", "Todos"],
                  ["facture", "Factures"],
                  ["devis", "Devis"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilterType(id)}
                  className={`px-3 py-2 text-[10px] uppercase tracking-[0.2em] border cursor-pointer ${
                    filterType === id
                      ? "bg-[#181716] text-white border-[#181716]"
                      : "bg-[#FAF9F6] text-[#6B6660] border-[#E5E1DA]"
                  }`}
                >
                  {label}
                </button>
              ))}

              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8780]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar casal ou nº..."
                  className="pl-8 pr-3 py-2 text-xs border border-[#D8D3CB] bg-[#FAF9F6] focus:bg-white focus:border-[#181716] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {filteredDocs.map((doc) => {
              const isDevis = doc.docType === "devis";
              const st = STATUS_LABELS[doc.status] || STATUS_LABELS.draft;

              return (
                <div
                  key={doc.id}
                  className="bg-white border border-[#E5E1DA] hover:border-[#9E8765] transition-colors p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`px-2.5 py-0.5 text-[9px] uppercase tracking-[0.24em] text-white font-medium ${
                          isDevis ? "bg-[#9E8765]" : "bg-[#181716]"
                        }`}
                      >
                        {isDevis ? "DEVIS" : "FACTURE"}
                      </span>
                      <span className="font-serif italic text-lg text-[#181716]">
                        {doc.docNumber}
                      </span>

                      <select
                        value={doc.status}
                        onChange={(e) =>
                          handleQuickStatusChange(
                            doc.id,
                            e.target.value as BillingDocStatus
                          )
                        }
                        aria-label="Status do documento"
                        className={`px-2.5 py-0.5 text-[10px] uppercase tracking-[0.16em] border cursor-pointer ${st.badgeClass}`}
                      >
                        <option value="draft">Rascunho</option>
                        <option value="sent">Enviado ao Cliente</option>
                        <option value="accepted">Devis Aceito</option>
                        <option value="deposit_paid">
                          Sinal Pago (Acompte)
                        </option>
                        <option value="paid">100% Quitado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>

                    <h2 className="font-serif text-2xl text-[#181716]">
                      {doc.clientName}
                    </h2>

                    <p className="text-xs text-[#6B6660] font-light">
                      Evento:{" "}
                      <strong className="font-medium text-[#181716]">
                        {doc.eventDate || "—"}
                      </strong>{" "}
                      · Local:{" "}
                      <strong className="font-medium text-[#181716]">
                        {doc.eventLocation || "—"}
                      </strong>
                    </p>
                  </div>

                  {/* Financial Summary & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#F2EFE9]">
                    <div className="sm:text-right">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C8780]">
                        Total TTC
                      </p>
                      <p className="font-serif text-2xl text-[#181716] font-medium">
                        {formatCurrencyFR(
                          doc.totalAmount,
                          doc.documentConfig?.currencySymbol || "€"
                        )}
                      </p>
                      {doc.depositAmount > 0 && (
                        <p className="text-[11px] text-[#9E8765]">
                          Acompte:{" "}
                          {formatCurrencyFR(
                            doc.depositAmount,
                            doc.documentConfig?.currencySymbol || "€"
                          )}{" "}
                          {!isDevis &&
                            `· Solde: ${formatCurrencyFR(
                              doc.balanceDue,
                              doc.documentConfig?.currencySymbol || "€"
                            )}`}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditDocument(doc)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#181716] text-white hover:bg-[#9E8765] text-[10px] uppercase tracking-[0.2em] transition-colors cursor-pointer"
                      >
                        <Sparkles size={13} />
                        <span>Editar Tudo</span>
                      </button>

                      <a
                        href={`/admin/billing-print/${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#181716] text-[#181716] hover:bg-[#181716] hover:text-white text-[10px] uppercase tracking-[0.2em] transition-colors"
                      >
                        <Printer size={13} />
                        <span>PDF A4</span>
                      </a>

                      {isDevis && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleConvertToFacture(doc)}
                          title="Gerar uma Fatura oficial a partir deste Devis"
                          className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#9E8765] bg-[#F6F3EE] text-[#181716] hover:bg-[#9E8765] hover:text-white text-[10px] uppercase tracking-[0.18em] transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft size={13} />
                          <span>Virar Fatura</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDuplicateDocument(doc)}
                        title="Duplicar documento"
                        className="p-2 border border-[#E5E1DA] text-[#6B6660] hover:text-[#181716] hover:border-[#181716] cursor-pointer"
                      >
                        <Copy size={14} />
                      </button>

                      {confirmDeleteId === doc.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="px-2.5 py-2 bg-red-700 text-white text-[10px] uppercase tracking-[0.18em] cursor-pointer"
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
                          onClick={() => setConfirmDeleteId(doc.id)}
                          title="Excluir documento"
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
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: INTERACTIVE EDITOR + LIVE A4 PREVIEW                         */}
      {/* =================================================================== */}
      {activeTab === "editor" && (
        <div className="space-y-6">
          {/* Top Editor Toolbar */}
          <div className="bg-white border border-[#E5E1DA] p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Switch Devis vs Facture */}
              <div className="inline-flex border border-[#D8D3CB] bg-[#FAF9F6] p-0.5">
                <button
                  type="button"
                  onClick={() => handleSwitchEditorDocType("devis")}
                  className={`px-3.5 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors cursor-pointer ${
                    editorState.docType === "devis"
                      ? "bg-[#9E8765] text-white font-medium"
                      : "text-[#6B6660] hover:text-[#181716]"
                  }`}
                >
                  Devis (Orçamento)
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchEditorDocType("facture")}
                  className={`px-3.5 py-2 text-[10px] uppercase tracking-[0.2em] transition-colors cursor-pointer ${
                    editorState.docType === "facture"
                      ? "bg-[#181716] text-white font-medium"
                      : "text-[#6B6660] hover:text-[#181716]"
                  }`}
                >
                  Facture (Fatura)
                </button>
              </div>

              {/* 1-Click Language Label Presets */}
              <div className="flex items-center gap-1.5 border border-[#E5E1DA] px-3 py-1.5 bg-[#FAF9F6]">
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#8C8780] mr-1">
                  Idioma da Folha:
                </span>
                {(
                  [
                    ["fr", "FR 🇫🇷"],
                    ["pt", "PT 🇧🇷"],
                    ["en", "EN 🇬🇧"],
                  ] as const
                ).map(([langCode, label]) => (
                  <button
                    key={langCode}
                    type="button"
                    onClick={() => {
                      setEditorState((prev) => ({
                        ...prev,
                        documentConfig: applyLanguagePresetToConfig(
                          prev.documentConfig,
                          langCode,
                          prev.docType,
                          prev.docNumber
                        ),
                      }));
                      showToast(
                        `Rótulos da folha traduzidos para ${label}. Você ainda pode editar qualquer palavra!`
                      );
                    }}
                    className="px-2 py-1 text-[10px] uppercase tracking-[0.16em] bg-white border border-[#D8D3CB] hover:border-[#181716] text-[#181716] cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save & Export PDF Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Mobile Toggle Form vs Preview */}
              <div className="flex xl:hidden border border-[#D8D3CB]">
                <button
                  type="button"
                  onClick={() => setMobileEditorView("form")}
                  className={`px-3 py-2 text-[10px] uppercase tracking-[0.18em] ${
                    mobileEditorView === "form"
                      ? "bg-[#181716] text-white"
                      : "bg-white text-[#6B6660]"
                  }`}
                >
                  Campos
                </button>
                <button
                  type="button"
                  onClick={() => setMobileEditorView("preview")}
                  className={`px-3 py-2 text-[10px] uppercase tracking-[0.18em] flex items-center gap-1 ${
                    mobileEditorView === "preview"
                      ? "bg-[#9E8765] text-white"
                      : "bg-white text-[#6B6660]"
                  }`}
                >
                  <Eye size={12} />
                  <span>Ver Folha A4</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSaveDocument(false)}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#181716] bg-white text-[#181716] hover:bg-[#181716] hover:text-white text-[10px] uppercase tracking-[0.22em] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save size={14} />
                <span>{isPending ? "Salvando..." : "Salvar no Painel"}</span>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSaveDocument(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9E8765] text-white hover:bg-[#181716] text-[10px] uppercase tracking-[0.22em] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Printer size={14} />
                <span>Salvar &amp; Gerar PDF A4</span>
              </button>
            </div>
          </div>

          {/* Two-Column Split: Left Form (9 Complete Sections) + Right Live A4 Preview */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: 100% Editable Form Accordion */}
            <div
              className={`xl:col-span-5 space-y-3 ${
                mobileEditorView === "preview" ? "hidden xl:block" : "block"
              }`}
            >
              <div className="bg-[#F6F3EE] border border-[#E2D9C8] px-4 py-3 text-xs text-[#59534B]">
                💡 <strong>Edição 100% Livre:</strong> Clique em qualquer seção
                abaixo — ou <strong>clique diretamente sobre qualquer bloco da folha A4 ao lado</strong> — para editar qualquer texto, rótulo ou valor.
              </div>

              {EDITOR_SECTIONS.map((sec) => {
                const isOpen = activeZone === sec.id;
                return (
                  <div
                    key={sec.id}
                    className={`bg-white border transition-colors ${
                      isOpen ? "border-[#9E8765]" : "border-[#E5E1DA]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveZone(sec.id)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer"
                    >
                      <div>
                        <span className="text-[9px] uppercase tracking-[0.28em] text-[#9E8765] font-semibold block">
                          Seção {sec.number}
                        </span>
                        <span className="font-serif text-lg text-[#181716] font-medium">
                          {sec.title}
                        </span>
                        <span className="block text-[11px] text-[#8C8780] font-light">
                          {sec.subtitle}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 border ${
                          isOpen
                            ? "bg-[#9E8765] text-white border-[#9E8765]"
                            : "bg-[#FAF9F6] text-[#6B6660] border-[#E5E1DA]"
                        }`}
                      >
                        {isOpen ? "Aberta" : "Editar"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-3 border-t border-[#F2EFE9] space-y-4">
                        {/* SECTION 1: IDENTITY & STATUS */}
                        {sec.id === "identity" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Texto do Selo Principal
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editorState.documentConfig.docBadgeLabel
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "docBadgeLabel",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Símbolo da Moeda
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editorState.documentConfig.currencySymbol
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "currencySymbol",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Prefixo Nº
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editorState.documentConfig.docNumberPrefix
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "docNumberPrefix",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Número do Documento
                                </label>
                                <input
                                  type="text"
                                  value={editorState.docNumber}
                                  onChange={(e) =>
                                    setEditorState((prev) => ({
                                      ...prev,
                                      docNumber: e.target.value,
                                    }))
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs font-medium"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Texto do Badge Dourado (Status / Validade na Folha)
                              </label>
                              <input
                                type="text"
                                value={
                                  editorState.documentConfig.docStatusBadge
                                }
                                onChange={(e) =>
                                  updateConfig("docStatusBadge", e.target.value)
                                }
                                placeholder="Ex: Acompte 30% Réglé · Solde à Échéance"
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Status Interno no Painel
                              </label>
                              <select
                                value={editorState.status}
                                onChange={(e) =>
                                  setEditorState((prev) => ({
                                    ...prev,
                                    status: e.target.value as BillingDocStatus,
                                  }))
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs bg-white"
                              >
                                <option value="draft">Rascunho</option>
                                <option value="sent">Enviado ao Cliente</option>
                                <option value="accepted">Devis Aceito</option>
                                <option value="deposit_paid">
                                  Sinal Pago (Acompte)
                                </option>
                                <option value="paid">100% Quitado</option>
                                <option value="cancelled">Cancelado</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* SECTION 2: CLIENT DETAILS */}
                        {sec.id === "client" && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Título do Quadro do Cliente
                              </label>
                              <input
                                type="text"
                                value={
                                  editorState.documentConfig.clientSectionLabel
                                }
                                onChange={(e) =>
                                  updateConfig(
                                    "clientSectionLabel",
                                    e.target.value
                                  )
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Nome dos Noivos / Cliente / Empresa
                              </label>
                              <input
                                type="text"
                                value={editorState.clientName}
                                onChange={(e) =>
                                  setEditorState((prev) => ({
                                    ...prev,
                                    clientName: e.target.value,
                                  }))
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs font-medium"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Endereço — Linha 1
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editorState.documentConfig
                                      .clientAddressLine1
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "clientAddressLine1",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Endereço / CEP / Cidade — Linha 2
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editorState.documentConfig
                                      .clientAddressLine2
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "clientAddressLine2",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Linha de E-mail na Folha
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editorState.documentConfig.clientEmailLine
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "clientEmailLine",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Linha de Telefone na Folha
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editorState.documentConfig.clientPhoneLine
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "clientPhoneLine",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Linha Complementar (Ex: Nº de Convidados ou SIRET do Cliente)
                              </label>
                              <input
                                type="text"
                                value={
                                  editorState.documentConfig.clientExtraLine
                                }
                                onChange={(e) =>
                                  updateConfig(
                                    "clientExtraLine",
                                    e.target.value
                                  )
                                }
                                placeholder="Ex: Invités prévus : ~120 personnes"
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>
                          </div>
                        )}

                        {/* SECTION 3: 4-COLUMN EVENT STRIP */}
                        {sec.id === "event" && (
                          <div className="space-y-4">
                            {(
                              [
                                [
                                  "Coluna 1 (Data de Emissão)",
                                  "metaCol1Label",
                                  "metaCol1Value",
                                ],
                                [
                                  "Coluna 2 (Data do Casamento / Evento)",
                                  "metaCol2Label",
                                  "metaCol2Value",
                                ],
                                [
                                  "Coluna 3 (Local do Evento)",
                                  "metaCol3Label",
                                  "metaCol3Value",
                                ],
                                [
                                  "Coluna 4 (Vencimento / Validade)",
                                  "metaCol4Label",
                                  "metaCol4Value",
                                ],
                              ] as const
                            ).map(([colTitle, labelKey, valKey]) => (
                              <div
                                key={labelKey}
                                className="p-3 bg-[#FAF9F6] border border-[#E5E1DA] space-y-2"
                              >
                                <p className="text-[9px] uppercase tracking-[0.22em] text-[#9E8765] font-semibold">
                                  {colTitle}
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[8px] uppercase tracking-[0.18em] text-[#8C8780] mb-1">
                                      Título da Coluna
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        editorState.documentConfig[labelKey]
                                      }
                                      onChange={(e) =>
                                        updateConfig(labelKey, e.target.value)
                                      }
                                      className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] uppercase tracking-[0.18em] text-[#8C8780] mb-1">
                                      Valor Exibido
                                    </label>
                                    <input
                                      type="text"
                                      value={editorState.documentConfig[valKey]}
                                      onChange={(e) =>
                                        updateConfig(valKey, e.target.value)
                                      }
                                      className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs font-medium"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* SECTION 4: LINE ITEMS & PACKAGES */}
                        {sec.id === "items" && (
                          <div className="space-y-4">
                            {/* Table Column Headers */}
                            <div className="p-3 bg-[#FAF9F6] border border-[#E5E1DA] space-y-2">
                              <p className="text-[9px] uppercase tracking-[0.2em] text-[#9E8765] font-semibold">
                                Títulos das Colunas da Tabela
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={
                                    editorState.documentConfig
                                      .tableColDesignation
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "tableColDesignation",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Désignation"
                                  className="border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs"
                                />
                                <div className="grid grid-cols-3 gap-1.5">
                                  <input
                                    type="text"
                                    value={
                                      editorState.documentConfig.tableColQty
                                    }
                                    onChange={(e) =>
                                      updateConfig(
                                        "tableColQty",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Qté"
                                    className="border border-[#D8D3CB] bg-white px-2 py-1.5 text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={
                                      editorState.documentConfig
                                        .tableColUnitPrice
                                    }
                                    onChange={(e) =>
                                      updateConfig(
                                        "tableColUnitPrice",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Prix Unit."
                                    className="border border-[#D8D3CB] bg-white px-2 py-1.5 text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={
                                      editorState.documentConfig.tableColTotal
                                    }
                                    onChange={(e) =>
                                      updateConfig(
                                        "tableColTotal",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Total"
                                    className="border border-[#D8D3CB] bg-white px-2 py-1.5 text-xs"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Quick Preset Packages */}
                            <div>
                              <p className="text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                                Inserir Pacote Rápido (1 Clique):
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {PHOTOGRAPHY_SERVICE_PRESETS.map((p, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleAddLineItem(p)}
                                    className="px-2.5 py-1 text-[10px] bg-[#FAF9F6] hover:bg-[#181716] hover:text-white border border-[#D8D3CB] transition-colors cursor-pointer"
                                  >
                                    + {p.title.split("—")[0].trim()} (
                                    {p.unitPrice} €)
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Individual Items List */}
                            <div className="space-y-3">
                              {editorState.items.map((item, idx) => (
                                <div
                                  key={item.id}
                                  className="p-3.5 border border-[#D8D3CB] bg-[#FAF9F6] space-y-2.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] uppercase tracking-[0.22em] text-[#9E8765] font-semibold">
                                      Item #{idx + 1}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleMoveLineItem(idx, -1)
                                        }
                                        disabled={idx === 0}
                                        className="p-1 border border-[#D8D3CB] bg-white disabled:opacity-30 cursor-pointer"
                                      >
                                        <ChevronUp size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleMoveLineItem(idx, 1)
                                        }
                                        disabled={
                                          idx === editorState.items.length - 1
                                        }
                                        className="p-1 border border-[#D8D3CB] bg-white disabled:opacity-30 cursor-pointer"
                                      >
                                        <ChevronDown size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveLineItem(item.id)
                                        }
                                        disabled={editorState.items.length <= 1}
                                        className="p-1 border border-[#D8D3CB] bg-white text-red-700 disabled:opacity-30 cursor-pointer"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                      Título do Serviço / Coleção
                                    </label>
                                    <input
                                      type="text"
                                      value={item.title}
                                      onChange={(e) =>
                                        handleUpdateLineItem(item.id, {
                                          title: e.target.value,
                                        })
                                      }
                                      className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs font-medium"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                      Descrição Artística / Detalhes
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={item.description}
                                      onChange={(e) =>
                                        handleUpdateLineItem(item.id, {
                                          description: e.target.value,
                                        })
                                      }
                                      className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs"
                                    />
                                  </div>

                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                        Texto Qtd (Ex: 1 Forfait)
                                      </label>
                                      <input
                                        type="text"
                                        value={item.quantityLabel}
                                        onChange={(e) =>
                                          handleUpdateLineItem(item.id, {
                                            quantityLabel: e.target.value,
                                          })
                                        }
                                        className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                        Multiplicador
                                      </label>
                                      <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          handleUpdateLineItem(item.id, {
                                            quantity:
                                              parseFloat(e.target.value) || 0,
                                          })
                                        }
                                        className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                        Preço Unit. ({editorState.documentConfig.currencySymbol})
                                      </label>
                                      <input
                                        type="number"
                                        step="10"
                                        value={item.unitPrice}
                                        onChange={(e) =>
                                          handleUpdateLineItem(item.id, {
                                            unitPrice:
                                              parseFloat(e.target.value) || 0,
                                          })
                                        }
                                        className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs font-medium"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddLineItem()}
                              className="w-full py-2.5 border border-dashed border-[#9E8765] text-[#181716] hover:bg-[#F6F3EE] text-[10px] uppercase tracking-[0.22em] cursor-pointer"
                            >
                              + Adicionar Nova Linha em Branco
                            </button>
                          </div>
                        )}

                        {/* SECTION 5: TOTALS, DISCOUNT, TVA & DEPOSIT */}
                        {sec.id === "totals" && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Rótulo do Subtotal
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editorState.documentConfig.subtotalLabel
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "subtotalLabel",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Rótulo do Total Geral
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editorState.documentConfig.grandTotalLabel
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "grandTotalLabel",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                />
                              </div>
                            </div>

                            {/* Optional Discount */}
                            <div className="p-3 bg-[#FAF9F6] border border-[#E5E1DA] space-y-2">
                              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    editorState.documentConfig.showDiscount
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "showDiscount",
                                      e.target.checked
                                    )
                                  }
                                />
                                <span>Aplicar Linha de Desconto (Remise)</span>
                              </label>
                              {editorState.documentConfig.showDiscount && (
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={
                                      editorState.documentConfig.discountLabel
                                    }
                                    onChange={(e) =>
                                      updateConfig(
                                        "discountLabel",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Rótulo do Desconto"
                                    className="border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs"
                                  />
                                  <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    value={editorState.discountAmount}
                                    onChange={(e) =>
                                      setEditorState((prev) => ({
                                        ...prev,
                                        discountAmount:
                                          parseFloat(e.target.value) || 0,
                                      }))
                                    }
                                    placeholder="Valor do desconto (€)"
                                    className="border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Tax / TVA */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Rótulo de TVA / Imposto
                                </label>
                                <input
                                  type="text"
                                  value={editorState.documentConfig.taxLabel}
                                  onChange={(e) =>
                                    updateConfig("taxLabel", e.target.value)
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Alíquota TVA (%)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={editorState.taxRate}
                                  onChange={(e) =>
                                    setEditorState((prev) => ({
                                      ...prev,
                                      taxRate: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                />
                              </div>
                            </div>

                            {/* Acompte / Deposit Controls */}
                            <div className="p-3.5 bg-[#F6F3EE] border border-[#E2D9C8] space-y-3">
                              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={
                                    editorState.documentConfig.showDeposit
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "showDeposit",
                                      e.target.checked
                                    )
                                  }
                                />
                                <span>
                                  Exibir Quadro de Sinal (Acompte)
                                </span>
                              </label>

                              {editorState.documentConfig.showDeposit && (
                                <>
                                  <div>
                                    <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-1">
                                      Texto do Sinal (Acompte)
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        editorState.documentConfig.depositLabel
                                      }
                                      onChange={(e) =>
                                        updateConfig(
                                          "depositLabel",
                                          e.target.value
                                        )
                                      }
                                      className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-1">
                                        Modo de Cálculo
                                      </label>
                                      <select
                                        value={
                                          editorState.documentConfig.depositMode
                                        }
                                        onChange={(e) =>
                                          updateConfig(
                                            "depositMode",
                                            e.target.value as
                                              | "percent"
                                              | "fixed"
                                          )
                                        }
                                        className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs"
                                      >
                                        <option value="percent">
                                          Porcentagem (%)
                                        </option>
                                        <option value="fixed">
                                          Valor Fixo Manual (€)
                                        </option>
                                      </select>
                                    </div>

                                    {editorState.documentConfig.depositMode ===
                                    "percent" ? (
                                      <div>
                                        <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-1">
                                          Percentual do Sinal (%)
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={
                                            editorState.documentConfig
                                              .depositPercent
                                          }
                                          onChange={(e) => {
                                            const pct =
                                              parseFloat(e.target.value) || 0;
                                            updateConfig("depositPercent", pct);
                                          }}
                                          className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs font-medium"
                                        />
                                      </div>
                                    ) : (
                                      <div>
                                        <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-1">
                                          Valor Fixo do Sinal (€)
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="10"
                                          value={editorState.fixedDepositAmount}
                                          onChange={(e) =>
                                            setEditorState((prev) => ({
                                              ...prev,
                                              fixedDepositAmount:
                                                parseFloat(e.target.value) || 0,
                                            }))
                                          }
                                          className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs font-medium"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col gap-1.5 pt-1">
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={
                                          editorState.documentConfig
                                            .deductDepositFromTotal
                                        }
                                        onChange={(e) =>
                                          updateConfig(
                                            "deductDepositFromTotal",
                                            e.target.checked
                                          )
                                        }
                                      />
                                      <span>
                                        Abater o sinal do Total (exibe sinal com{" "}
                                        <code>-</code>)
                                      </span>
                                    </label>

                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={
                                          editorState.documentConfig
                                            .showBalanceDue
                                        }
                                        onChange={(e) =>
                                          updateConfig(
                                            "showBalanceDue",
                                            e.target.checked
                                          )
                                        }
                                      />
                                      <span>
                                        Exibir Linha de Saldo a Pagar (Reste à payer)
                                      </span>
                                    </label>
                                  </div>

                                  {editorState.documentConfig
                                    .showBalanceDue && (
                                    <div>
                                      <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-1">
                                        Rótulo do Saldo a Pagar
                                      </label>
                                      <input
                                        type="text"
                                        value={
                                          editorState.documentConfig
                                            .balanceDueLabel
                                        }
                                        onChange={(e) =>
                                          updateConfig(
                                            "balanceDueLabel",
                                            e.target.value
                                          )
                                        }
                                        className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs"
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Menção Legal de TVA (Abaixo dos Totais)
                              </label>
                              <input
                                type="text"
                                value={
                                  editorState.documentConfig.taxNoticeText
                                }
                                onChange={(e) =>
                                  updateConfig("taxNoticeText", e.target.value)
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>
                          </div>
                        )}

                        {/* SECTION 6: PAYMENT & SEPA BANK DETAILS */}
                        {sec.id === "payment" && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Título do Quadro de Pagamento
                              </label>
                              <input
                                type="text"
                                value={
                                  editorState.documentConfig.paymentBoxTitle
                                }
                                onChange={(e) =>
                                  updateConfig(
                                    "paymentBoxTitle",
                                    e.target.value
                                  )
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Texto Principal / Cronograma de Pagamento
                              </label>
                              <textarea
                                rows={3}
                                value={
                                  editorState.documentConfig.paymentIntroText
                                }
                                onChange={(e) =>
                                  updateConfig(
                                    "paymentIntroText",
                                    e.target.value
                                  )
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>

                            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer pt-1">
                              <input
                                type="checkbox"
                                checked={
                                  editorState.documentConfig.showBankDetails
                                }
                                onChange={(e) =>
                                  updateConfig(
                                    "showBankDetails",
                                    e.target.checked
                                  )
                                }
                              />
                              <span>
                                Exibir Grade de Coordenadas Bancárias SEPA (IBAN / BIC)
                              </span>
                            </label>

                            {editorState.documentConfig.showBankDetails && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-[#FAF9F6] border border-[#E5E1DA]">
                                <div>
                                  <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                    Titular da Conta
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      editorState.documentConfig.bankHolder
                                    }
                                    onChange={(e) =>
                                      updateConfig("bankHolder", e.target.value)
                                    }
                                    className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                    Banco
                                  </label>
                                  <input
                                    type="text"
                                    value={editorState.documentConfig.bankName}
                                    onChange={(e) =>
                                      updateConfig("bankName", e.target.value)
                                    }
                                    className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs font-mono"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                    IBAN
                                  </label>
                                  <input
                                    type="text"
                                    value={editorState.documentConfig.bankIban}
                                    onChange={(e) =>
                                      updateConfig("bankIban", e.target.value)
                                    }
                                    className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs font-mono"
                                  />
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                    BIC / SWIFT
                                  </label>
                                  <input
                                    type="text"
                                    value={editorState.documentConfig.bankBic}
                                    onChange={(e) =>
                                      updateConfig("bankBic", e.target.value)
                                    }
                                    className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs font-mono"
                                  />
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Condições no Rodapé do Quadro Bancário
                              </label>
                              <textarea
                                rows={2}
                                value={
                                  editorState.documentConfig
                                    .paymentConditionsText
                                }
                                onChange={(e) =>
                                  updateConfig(
                                    "paymentConditionsText",
                                    e.target.value
                                  )
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>
                          </div>
                        )}

                        {/* SECTION 7: EMITTER & BRAND HEADER */}
                        {sec.id === "emitter" && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Subtítulo Superior do Cabeçalho
                              </label>
                              <input
                                type="text"
                                value={editorState.documentConfig.atelierTag}
                                onChange={(e) =>
                                  updateConfig("atelierTag", e.target.value)
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Nome da Marca no Topo
                              </label>
                              <input
                                type="text"
                                value={editorState.documentConfig.brandName}
                                onChange={(e) =>
                                  updateConfig("brandName", e.target.value)
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Especialidades Abaixo do Nome
                              </label>
                              <input
                                type="text"
                                value={editorState.documentConfig.brandSubtitle}
                                onChange={(e) =>
                                  updateConfig("brandSubtitle", e.target.value)
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>

                            <hr className="border-[#E5E1DA]" />

                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Título do Bloco do Fotógrafo
                              </label>
                              <input
                                type="text"
                                value={
                                  editorState.documentConfig.emitterSectionLabel
                                }
                                onChange={(e) =>
                                  updateConfig(
                                    "emitterSectionLabel",
                                    e.target.value
                                  )
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Nome do Fotógrafo / Emissor
                              </label>
                              <input
                                type="text"
                                value={editorState.documentConfig.emitterName}
                                onChange={(e) =>
                                  updateConfig("emitterName", e.target.value)
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Profissão / Especialidade
                              </label>
                              <input
                                type="text"
                                value={editorState.documentConfig.emitterRole}
                                onChange={(e) =>
                                  updateConfig("emitterRole", e.target.value)
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Localização / Endereço Profissional
                              </label>
                              <input
                                type="text"
                                value={
                                  editorState.documentConfig.emitterLocation
                                }
                                onChange={(e) =>
                                  updateConfig(
                                    "emitterLocation",
                                    e.target.value
                                  )
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Linha de E-mail
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editorState.documentConfig.emitterEmail
                                  }
                                  onChange={(e) =>
                                    updateConfig("emitterEmail", e.target.value)
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                  Linha do Site
                                </label>
                                <input
                                  type="text"
                                  value={
                                    editorState.documentConfig.emitterWebsite
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "emitterWebsite",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Linha Fiscal (Status Jurídico · SIRET · Code APE)
                              </label>
                              <input
                                type="text"
                                value={
                                  editorState.documentConfig.emitterLegalLine
                                }
                                onChange={(e) =>
                                  updateConfig(
                                    "emitterLegalLine",
                                    e.target.value
                                  )
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>
                          </div>
                        )}

                        {/* SECTION 8: SIGNATURES BLOCK */}
                        {sec.id === "signatures" && (
                          <div className="space-y-3">
                            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={
                                  editorState.documentConfig.showSignatures
                                }
                                onChange={(e) =>
                                  updateConfig(
                                    "showSignatures",
                                    e.target.checked
                                  )
                                }
                              />
                              <span>
                                Exibir Quadro Duplo de Assinaturas na Folha A4
                              </span>
                            </label>

                            {editorState.documentConfig.showSignatures && (
                              <div className="space-y-3 pt-2">
                                <div>
                                  <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                    Título Assinatura do Fotógrafo (Esquerda)
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      editorState.documentConfig
                                        .photographerSigTitle
                                    }
                                    onChange={(e) =>
                                      updateConfig(
                                        "photographerSigTitle",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                    Subtítulo Assinatura do Fotógrafo
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      editorState.documentConfig
                                        .photographerSigSubtitle
                                    }
                                    onChange={(e) =>
                                      updateConfig(
                                        "photographerSigSubtitle",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                    Assinatura Cursiva do Fotógrafo
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      editorState.documentConfig
                                        .photographerSigName
                                    }
                                    onChange={(e) =>
                                      updateConfig(
                                        "photographerSigName",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs font-serif italic"
                                  />
                                </div>

                                <hr className="border-[#E5E1DA]" />

                                <div>
                                  <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                    Título do Quadro de Acordo do Cliente (Direita)
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      editorState.documentConfig.clientSigTitle
                                    }
                                    onChange={(e) =>
                                      updateConfig(
                                        "clientSigTitle",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                    Instrução « Bon pour accord »
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      editorState.documentConfig
                                        .clientSigSubtitle
                                    }
                                    onChange={(e) =>
                                      updateConfig(
                                        "clientSigSubtitle",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                    Linha de Data e Assinatura
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      editorState.documentConfig
                                        .clientSigDatePrompt
                                    }
                                    onChange={(e) =>
                                      updateConfig(
                                        "clientSigDatePrompt",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* SECTION 9: LEGAL FOOTER */}
                        {sec.id === "footer" && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Linha 1 do Rodapé (Identificação & SIRET)
                              </label>
                              <input
                                type="text"
                                value={editorState.documentConfig.footerLine1}
                                onChange={(e) =>
                                  updateConfig("footerLine1", e.target.value)
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                                Linha 2 do Rodapé (Cláusula Legal / Penalidades / Reserva)
                              </label>
                              <textarea
                                rows={3}
                                value={editorState.documentConfig.footerLine2}
                                onChange={(e) =>
                                  updateConfig("footerLine2", e.target.value)
                                }
                                className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* RIGHT COLUMN: LIVE INTERACTIVE A4 PREVIEW */}
            <div
              className={`xl:col-span-7 xl:sticky xl:top-6 ${
                mobileEditorView === "form" ? "hidden xl:block" : "block"
              }`}
            >
              <div className="bg-[#EAE7E1] border border-[#D8D3CB] p-3 sm:p-6 overflow-x-auto">
                <div className="flex items-center justify-between mb-3 text-[10px] uppercase tracking-[0.2em] text-[#5E5952]">
                  <span>
                    Preview A4 Ao Vivo ({editorState.docNumber}) — Clique em
                    qualquer bloco da folha para editar
                  </span>
                  <span className="font-semibold text-[#181716]">
                    Total:{" "}
                    {formatCurrencyFR(
                      liveTotals.totalAmount,
                      editorState.documentConfig.currencySymbol
                    )}
                  </span>
                </div>

                {/* Responsive Scale Wrapper for the A4 Sheet */}
                <div className="origin-top-left sm:origin-top scale-[0.42] sm:scale-[0.68] md:scale-[0.78] lg:scale-[0.72] 2xl:scale-[0.85] h-[130mm] sm:h-[205mm] md:h-[235mm] lg:h-[218mm] 2xl:h-[255mm] transition-all">
                  <BillingA4DocumentSheet
                    docType={editorState.docType}
                    docNumber={editorState.docNumber}
                    clientName={editorState.clientName}
                    items={editorState.items}
                    discountAmount={editorState.discountAmount}
                    taxRate={editorState.taxRate}
                    fixedDepositAmount={editorState.fixedDepositAmount}
                    config={editorState.documentConfig}
                    activeZone={activeZone}
                    onSelectZone={(zone) => {
                      setActiveZone(zone);
                      setMobileEditorView("form");
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: DEFAULT FISCAL & BANK SETTINGS                               */}
      {/* =================================================================== */}
      {activeTab === "settings" && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white border border-[#E5E1DA] p-6 sm:p-8 space-y-8 max-w-4xl"
        >
          <div className="pb-4 border-b border-[#F2EFE9]">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#9E8765] mb-1">
              Configurações Padrão de Emissão
            </p>
            <h2 className="font-serif text-2xl text-[#181716]">
              Meus Dados Fiscais, SIRET &amp; Coordenadas Bancárias SEPA
            </h2>
            <p className="text-xs text-[#6B6660] font-light mt-1">
              Estes dados preenchem automaticamente toda nova Fatura ou Devis
              que você criar (e você ainda poderá editá-los individualmente em
              cada documento).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Nome do Emissor / Fotógrafo
              </label>
                              <input
                type="text"
                value={settings.emitterName}
                onChange={(e) =>
                  setSettings({ ...settings, emitterName: e.target.value })
                }
                className="w-full border border-[#D8D3CB] px-3.5 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Título Profissional
              </label>
              <input
                type="text"
                value={settings.emitterRole}
                onChange={(e) =>
                  setSettings({ ...settings, emitterRole: e.target.value })
                }
                className="w-full border border-[#D8D3CB] px-3.5 py-2.5 text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Linha Fiscal (Entrepreneur Individuel · SIRET · Code APE)
              </label>
              <input
                type="text"
                value={settings.emitterLegalLine}
                onChange={(e) =>
                  setSettings({ ...settings, emitterLegalLine: e.target.value })
                }
                className="w-full border border-[#D8D3CB] px-3.5 py-2.5 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Localização / Endereço Profissional
              </label>
              <input
                type="text"
                value={settings.emitterLocation}
                onChange={(e) =>
                  setSettings({ ...settings, emitterLocation: e.target.value })
                }
                className="w-full border border-[#D8D3CB] px-3.5 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Linha de E-mail Profissional
              </label>
              <input
                type="text"
                value={settings.emitterEmail}
                onChange={(e) =>
                  setSettings({ ...settings, emitterEmail: e.target.value })
                }
                className="w-full border border-[#D8D3CB] px-3.5 py-2.5 text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#F2EFE9] grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Titular da Conta Bancária
              </label>
              <input
                type="text"
                value={settings.bankHolder}
                onChange={(e) =>
                  setSettings({ ...settings, bankHolder: e.target.value })
                }
                className="w-full border border-[#D8D3CB] px-3.5 py-2.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Nome do Banco
              </label>
              <input
                type="text"
                value={settings.bankName}
                onChange={(e) =>
                  setSettings({ ...settings, bankName: e.target.value })
                }
                className="w-full border border-[#D8D3CB] px-3.5 py-2.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                IBAN Oficial
              </label>
              <input
                type="text"
                value={settings.bankIban}
                onChange={(e) =>
                  setSettings({ ...settings, bankIban: e.target.value })
                }
                className="w-full border border-[#D8D3CB] px-3.5 py-2.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                BIC / SWIFT
              </label>
              <input
                type="text"
                value={settings.bankBic}
                onChange={(e) =>
                  setSettings({ ...settings, bankBic: e.target.value })
                }
                className="w-full border border-[#D8D3CB] px-3.5 py-2.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#F2EFE9] grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Sinal Padrão (Acompte %)
              </label>
              <input
                type="number"
                value={settings.defaultDepositPercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultDepositPercent: parseFloat(e.target.value) || 30,
                  })
                }
                className="w-full border border-[#D8D3CB] px-3.5 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Próximo Nº Sequencial Facture
              </label>
              <input
                type="number"
                value={settings.nextInvoiceSeq}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    nextInvoiceSeq: parseInt(e.target.value, 10) || 1,
                  })
                }
                className="w-full border border-[#D8D3CB] px-3.5 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Próximo Nº Sequencial Devis
              </label>
              <input
                type="number"
                value={settings.nextDevisSeq}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    nextDevisSeq: parseInt(e.target.value, 10) || 1,
                  })
                }
                className="w-full border border-[#D8D3CB] px-3.5 py-2.5 text-xs"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#181716] text-white hover:bg-[#9E8765] text-[10px] uppercase tracking-[0.24em] transition-colors cursor-pointer"
            >
              <Check size={14} />
              <span>Salvar Dados Padrão</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

