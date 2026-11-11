"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
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
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
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

interface ResponsiveA4PreviewStageProps {
  docType: BillingDocType;
  docNumber: string;
  clientName: string;
  items: BillingLineItem[];
  discountAmount: number;
  taxRate: number;
  fixedDepositAmount?: number;
  config: BillingDocumentConfig;
  activeZone?: BillingEditorZone;
  onSelectZone?: (zone: BillingEditorZone) => void;
  lastEditedLabel?: string;
  onOpenFullscreen?: () => void;
  onInstantPrint?: () => void;
}

function ResponsiveA4PreviewStage({
  docType,
  docNumber,
  clientName,
  items,
  discountAmount,
  taxRate,
  fixedDepositAmount,
  config,
  activeZone,
  onSelectZone,
  lastEditedLabel,
  onOpenFullscreen,
  onInstantPrint,
}: ResponsiveA4PreviewStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(560);
  const [zoomMode, setZoomMode] = useState<"fit" | "100">("fit");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const w = el.clientWidth;
      if (w > 100) setContainerWidth(w);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fitScale = Math.min(1, Math.max(0.32, (containerWidth - 24) / 794));
  const scale = zoomMode === "100" ? 1 : fitScale;
  const scaledWidth = Math.round(794 * scale);
  const scaledHeight = Math.round(1123 * scale);

  const totals = calculateBillingTotals(
    items,
    discountAmount,
    taxRate,
    config,
    fixedDepositAmount
  );

  const activeZoneTitle =
    EDITOR_SECTIONS.find((s) => s.id === activeZone)?.title ||
    "Folha A4 Interativa";

  return (
    <div className="bg-[#EAE7E1] border border-[#D8D3CB] shadow-xs">
      {/* Live Preview Header Bar */}
      <div className="bg-[#181716] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div className="truncate">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#BFA989] font-medium truncate">
              Previsualização A4 em Tempo Real
            </p>
            <p className="text-[11px] text-white/75 truncate">
              {lastEditedLabel
                ? `Última edição: ${lastEditedLabel}`
                : `Seção destacada: ${activeZoneTitle}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomMode(zoomMode === "fit" ? "100" : "fit")}
            title={
              zoomMode === "fit"
                ? "Ver em tamanho 100% real"
                : "Ajustar automaticamente à largura da tela"
            }
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase tracking-[0.16em] cursor-pointer"
          >
            {zoomMode === "fit" ? <ZoomIn size={12} /> : <ZoomOut size={12} />}
            <span>
              {zoomMode === "fit"
                ? `${Math.round(scale * 100)}% (Auto)`
                : "100%"}
            </span>
          </button>

          {onOpenFullscreen && (
            <button
              type="button"
              onClick={onOpenFullscreen}
              title="Abrir previsualização em Tela Cheia"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase tracking-[0.16em] cursor-pointer"
            >
              <Maximize2 size={12} />
              <span className="hidden sm:inline">Tela Cheia</span>
            </button>
          )}

          {onInstantPrint && (
            <button
              type="button"
              onClick={onInstantPrint}
              title="Imprimir ou Salvar como PDF agora mesmo"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#9E8765] hover:bg-white hover:text-[#181716] text-white text-[10px] uppercase tracking-[0.18em] font-medium transition-colors cursor-pointer"
            >
              <Printer size={12} />
              <span>PDF Agora</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-bar with Quick Totals & Interactive Hint */}
      <div className="px-4 py-2 bg-[#F6F3EE] border-b border-[#E2D9C8] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#59534B]">
        <span>
          👆 <strong>Dica:</strong> Clique sobre qualquer parte da folha abaixo
          para ir direto ao campo correspondente.
        </span>
        <span className="font-medium text-[#181716]">
          Total TTC:{" "}
          <strong>
            {formatCurrencyFR(totals.totalAmount, config.currencySymbol)}
          </strong>
          {config.showDeposit && (
            <span className="text-[#9E8765] ml-2">
              · Sinal:{" "}
              {formatCurrencyFR(totals.depositAmount, config.currencySymbol)}
            </span>
          )}
        </span>
      </div>

      {/* Scaled A4 Viewport */}
      <div
        ref={containerRef}
        className="p-3 sm:p-4 flex justify-center overflow-x-auto"
      >
        <div
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
          }}
          className="relative shrink-0 transition-all duration-150"
        >
          <div
            style={{
              width: "794px",
              height: "1123px",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <BillingA4DocumentSheet
              docType={docType}
              docNumber={docNumber}
              clientName={clientName}
              items={items}
              discountAmount={discountAmount}
              taxRate={taxRate}
              fixedDepositAmount={fixedDepositAmount}
              config={config}
              activeZone={activeZone}
              onSelectZone={onSelectZone}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [lastEditedLabel, setLastEditedLabel] = useState<string>("");
  const [fullscreenPreviewOpen, setFullscreenPreviewOpen] = useState(false);
  const [editingPresetsOpen, setEditingPresetsOpen] = useState(false);

  const activeServicePresets =
    settings.servicePresets && settings.servicePresets.length > 0
      ? settings.servicePresets
      : PHOTOGRAPHY_SERVICE_PRESETS;

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

    const firstPreset =
      settings.servicePresets && settings.servicePresets.length > 0
        ? settings.servicePresets[0]
        : PHOTOGRAPHY_SERVICE_PRESETS[0];

    const defaultItems: BillingLineItem[] = [
      {
        id: "item-default-1",
        ...firstPreset,
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
  // On smaller screens (< lg): "split" shows BOTH live preview + form, "form" shows form only, "preview" shows preview only
  const [mobileEditorView, setMobileEditorView] = useState<
    "split" | "form" | "preview"
  >("split");

  // Trigger native browser print of the live preview immediately
  const handleInstantLivePrint = () => {
    window.print();
  };

  // Open a new blank document in Editor
  const handleStartNewDocument = (type: BillingDocType) => {
    setEditorState(buildNewEditorDraft(type, null));
    setActiveZone("client");
    setLastEditedLabel("Novo documento iniciado");
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
      clientPhone: doc.clientPhone,
      clientEmail: doc.clientEmail,
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
    setLastEditedLabel(`Documento ${doc.docNumber} carregado`);
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
    setLastEditedLabel(`Cópia ${nextNum}`);
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

    setLastEditedLabel(
      isDevis ? "Alterado para Devis" : "Alterado para Facture"
    );

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

  // Update a single key in documentConfig and track real-time edit label
  const updateConfig = <K extends keyof BillingDocumentConfig>(
    key: K,
    value: BillingDocumentConfig[K],
    label?: string
  ) => {
    if (label) setLastEditedLabel(label);
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

    setLastEditedLabel(`Adicionado: ${newItem.title}`);
    setEditorState((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleUpdateLineItem = (
    id: string,
    patch: Partial<BillingLineItem>,
    label?: string
  ) => {
    if (label) setLastEditedLabel(label);
    setEditorState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

  const handleMoveLineItem = (index: number, direction: -1 | 1) => {
    setLastEditedLabel("Ordem dos serviços alterada");
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
    setLastEditedLabel("Serviço removido");
    setEditorState((prev) => ({
      ...prev,
      items:
        prev.items.length > 1
          ? prev.items.filter((i) => i.id !== id)
          : prev.items,
    }));
  };

  // Service & Package Presets Catalog Management (saved in billingSettings)
  const handleUpdatePresetItem = (
    index: number,
    patch: Partial<Omit<BillingLineItem, "id">>
  ) => {
    setSettings((prev) => {
      const current =
        prev.servicePresets && prev.servicePresets.length > 0
          ? [...prev.servicePresets]
          : [...PHOTOGRAPHY_SERVICE_PRESETS];
      if (!current[index]) return prev;
      current[index] = { ...current[index], ...patch };
      return { ...prev, servicePresets: current };
    });
  };

  const handleAddPresetItem = () => {
    setSettings((prev) => {
      const current =
        prev.servicePresets && prev.servicePresets.length > 0
          ? [...prev.servicePresets]
          : [...PHOTOGRAPHY_SERVICE_PRESETS];
      const nextPreset: Omit<BillingLineItem, "id"> = {
        title: "Nouvelle Collection / Prestation — Sur Mesure",
        description:
          "Description complète de votre forfait ou prestation photographique...",
        quantityLabel: "1 Forfait",
        quantity: 1,
        unitPrice: 950,
      };
      return { ...prev, servicePresets: [...current, nextPreset] };
    });
  };

  const handleRemovePresetItem = (index: number) => {
    setSettings((prev) => {
      const current =
        prev.servicePresets && prev.servicePresets.length > 0
          ? [...prev.servicePresets]
          : [...PHOTOGRAPHY_SERVICE_PRESETS];
      if (current.length <= 1) return prev;
      return {
        ...prev,
        servicePresets: current.filter((_, idx) => idx !== index),
      };
    });
  };

  const handleMovePresetItem = (index: number, direction: -1 | 1) => {
    setSettings((prev) => {
      const current =
        prev.servicePresets && prev.servicePresets.length > 0
          ? [...prev.servicePresets]
          : [...PHOTOGRAPHY_SERVICE_PRESETS];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return prev;
      const temp = current[index];
      current[index] = current[targetIndex];
      current[targetIndex] = temp;
      return { ...prev, servicePresets: current };
    });
  };

  const handleResetPresetItems = () => {
    const nextSettings: BillingDefaultSettingsJson = {
      ...settings,
      servicePresets: PHOTOGRAPHY_SERVICE_PRESETS.map((p) => ({ ...p })),
    };
    setSettings(nextSettings);
    startTransition(async () => {
      await saveBillingSettingsAction(nextSettings);
      showToast("Pacotes rápidos restaurados para as sugestões originais!");
      router.refresh();
    });
  };

  const handleSavePresetsCatalog = () => {
    startTransition(async () => {
      await saveBillingSettingsAction(settings);
      showToast("Meus Pacotes Rápidos salvos com sucesso!");
      router.refresh();
    });
  };

  const handleSaveLineItemAsPreset = (item: BillingLineItem) => {
    const current =
      settings.servicePresets && settings.servicePresets.length > 0
        ? [...settings.servicePresets]
        : [...PHOTOGRAPHY_SERVICE_PRESETS];
    const newPreset: Omit<BillingLineItem, "id"> = {
      title: item.title,
      description: item.description,
      quantityLabel: item.quantityLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    };
    const nextSettings: BillingDefaultSettingsJson = {
      ...settings,
      servicePresets: [...current, newPreset],
    };
    setSettings(nextSettings);
    startTransition(async () => {
      await saveBillingSettingsAction(nextSettings);
      showToast(
        `"${item.title.split("—")[0].trim()}" adicionado aos seus Pacotes Rápidos!`
      );
      router.refresh();
    });
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
        eventDate: editorState.documentConfig.metaCol2Value,
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

  // Update Settings AND sync into current Editor draft so he sees his settings changes live!
  const updateSettingsAndSyncPreview = (
    patch: Partial<BillingDefaultSettingsJson>,
    label: string
  ) => {
    setLastEditedLabel(label);
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      setEditorState((ed) => ({
        ...ed,
        documentConfig: {
          ...ed.documentConfig,
          ...(patch.atelierTag !== undefined
            ? { atelierTag: patch.atelierTag }
            : {}),
          ...(patch.brandName !== undefined
            ? { brandName: patch.brandName }
            : {}),
          ...(patch.brandSubtitle !== undefined
            ? { brandSubtitle: patch.brandSubtitle }
            : {}),
          ...(patch.emitterName !== undefined
            ? {
                emitterName: patch.emitterName,
                photographerSigName: patch.emitterName,
              }
            : {}),
          ...(patch.emitterRole !== undefined
            ? { emitterRole: patch.emitterRole }
            : {}),
          ...(patch.emitterLocation !== undefined
            ? { emitterLocation: patch.emitterLocation }
            : {}),
          ...(patch.emitterEmail !== undefined
            ? { emitterEmail: patch.emitterEmail }
            : {}),
          ...(patch.emitterWebsite !== undefined
            ? { emitterWebsite: patch.emitterWebsite }
            : {}),
          ...(patch.emitterLegalLine !== undefined
            ? { emitterLegalLine: patch.emitterLegalLine }
            : {}),
          ...(patch.bankHolder !== undefined
            ? { bankHolder: patch.bankHolder }
            : {}),
          ...(patch.bankName !== undefined ? { bankName: patch.bankName } : {}),
          ...(patch.bankIban !== undefined ? { bankIban: patch.bankIban } : {}),
          ...(patch.bankBic !== undefined ? { bankBic: patch.bankBic } : {}),
        },
      }));
      return next;
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

  return (
    <>
      {/* Hidden Direct-Print A4 Sheet (when user clicks "PDF Agora" directly inside /admin/billing) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #billing-live-print-root,
          #billing-live-print-root * {
            visibility: visible;
          }
          #billing-live-print-root {
            position: fixed;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            background: #FFFFFF;
            z-index: 99999;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
      <div id="billing-live-print-root" className="hidden print:block">
        <BillingA4DocumentSheet
          docType={editorState.docType}
          docNumber={editorState.docNumber}
          clientName={editorState.clientName}
          items={editorState.items}
          discountAmount={editorState.discountAmount}
          taxRate={editorState.taxRate}
          fixedDepositAmount={editorState.fixedDepositAmount}
          config={editorState.documentConfig}
          printMode={true}
        />
      </div>

      {/* Fullscreen Live A4 Preview Modal */}
      {fullscreenPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col print:hidden">
          <div className="bg-[#181716] text-white px-6 py-4 flex items-center justify-between border-b border-white/15">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs uppercase tracking-[0.22em] text-[#BFA989]">
                Previsualização em Tamanho Real A4 ({editorState.docNumber} ·{" "}
                {editorState.clientName})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleInstantLivePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#9E8765] text-white text-[10px] uppercase tracking-[0.22em] cursor-pointer"
              >
                <Printer size={14} />
                <span>Imprimir / Salvar PDF A4</span>
              </button>
              <button
                type="button"
                onClick={() => setFullscreenPreviewOpen(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-white/25 text-white text-[10px] uppercase tracking-[0.2em] cursor-pointer"
              >
                <Minimize2 size={14} />
                <span>Fechar Tela Cheia</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6 sm:p-10 flex justify-center">
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
                setFullscreenPreviewOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <div className="space-y-8 print:hidden">
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
              Edite qualquer informação e acompanhe a folha A4 sendo atualizada
              letra por letra em tempo real ao lado.
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
                  ? `Editor + Preview (${editorState.docNumber})`
                  : "Editor + Preview em Tempo Real"}
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
                          <span>Editar com Preview</span>
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
        {/* TAB 2: INTERACTIVE EDITOR + REAL-TIME LIVE A4 PREVIEW               */}
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
                        setLastEditedLabel(`Idioma alterado para ${label}`);
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
                          `Rótulos da folha traduzidos para ${label} em tempo real!`
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
                {/* Mobile/Tablet View Switcher (Split Live Preview is Default!) */}
                <div className="flex lg:hidden border border-[#D8D3CB]">
                  <button
                    type="button"
                    onClick={() => setMobileEditorView("split")}
                    className={`px-2.5 py-2 text-[10px] uppercase tracking-[0.16em] ${
                      mobileEditorView === "split"
                        ? "bg-[#9E8765] text-white font-medium"
                        : "bg-white text-[#6B6660]"
                    }`}
                  >
                    Campos + A4 Ao Vivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileEditorView("form")}
                    className={`px-2.5 py-2 text-[10px] uppercase tracking-[0.16em] ${
                      mobileEditorView === "form"
                        ? "bg-[#181716] text-white"
                        : "bg-white text-[#6B6660]"
                    }`}
                  >
                    Só Campos
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileEditorView("preview")}
                    className={`px-2.5 py-2 text-[10px] uppercase tracking-[0.16em] flex items-center gap-1 ${
                      mobileEditorView === "preview"
                        ? "bg-[#181716] text-white"
                        : "bg-white text-[#6B6660]"
                    }`}
                  >
                    <Eye size={12} />
                    <span>Só Folha A4</span>
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
                  <span>Salvar &amp; Abrir PDF A4</span>
                </button>
              </div>
            </div>

            {/* Two-Column Split on Desktop/Laptop (lg:grid-cols-12) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: 9 Editable Sections */}
              <div
                className={`lg:col-span-5 space-y-3 order-2 lg:order-1 ${
                  mobileEditorView === "preview" ? "hidden lg:block" : "block"
                }`}
              >
                {EDITOR_SECTIONS.map((sec) => {
                  const isOpen = activeZone === sec.id;
                  return (
                    <div
                      key={sec.id}
                      className={`bg-white border transition-colors ${
                        isOpen
                          ? "border-[#9E8765] shadow-xs"
                          : "border-[#E5E1DA]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveZone(sec.id)}
                        className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between text-left cursor-pointer"
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
                          className={`text-[10px] uppercase tracking-[0.16em] px-2.5 py-1 border shrink-0 ${
                            isOpen
                              ? "bg-[#9E8765] text-white border-[#9E8765]"
                              : "bg-[#FAF9F6] text-[#6B6660] border-[#E5E1DA]"
                          }`}
                        >
                          {isOpen ? "Editando" : "Abrir"}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-[#F2EFE9] space-y-4">
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
                                        e.target.value,
                                        "Selo Principal"
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
                                        e.target.value,
                                        "Moeda"
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
                                        e.target.value,
                                        "Prefixo Nº"
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
                                    onChange={(e) => {
                                      setLastEditedLabel("Número do Documento");
                                      setEditorState((prev) => ({
                                        ...prev,
                                        docNumber: e.target.value,
                                      }));
                                    }}
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
                                    updateConfig(
                                      "docStatusBadge",
                                      e.target.value,
                                      "Badge de Status"
                                    )
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
                                      status: e.target
                                        .value as BillingDocStatus,
                                    }))
                                  }
                                  className="w-full border border-[#D8D3CB] px-3 py-2 text-xs bg-white"
                                >
                                  <option value="draft">Rascunho</option>
                                  <option value="sent">
                                    Enviado ao Cliente
                                  </option>
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
                                    editorState.documentConfig
                                      .clientSectionLabel
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "clientSectionLabel",
                                      e.target.value,
                                      "Título do Quadro Cliente"
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
                                  onChange={(e) => {
                                    setLastEditedLabel("Nome do Cliente");
                                    setEditorState((prev) => ({
                                      ...prev,
                                      clientName: e.target.value,
                                    }));
                                  }}
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
                                        e.target.value,
                                        "Endereço do Cliente"
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
                                        e.target.value,
                                        "Cidade/CEP do Cliente"
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
                                        e.target.value,
                                        "E-mail do Cliente"
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
                                        e.target.value,
                                        "Telefone do Cliente"
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
                                      e.target.value,
                                      "Informação Complementar do Cliente"
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
                                          updateConfig(
                                            labelKey,
                                            e.target.value,
                                            colTitle
                                          )
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
                                        value={
                                          editorState.documentConfig[valKey]
                                        }
                                        onChange={(e) =>
                                          updateConfig(
                                            valKey,
                                            e.target.value,
                                            colTitle
                                          )
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
                                        e.target.value,
                                        "Cabeçalho da Tabela"
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
                                          e.target.value,
                                          "Coluna Qtd"
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
                                          e.target.value,
                                          "Coluna Preço Unit."
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
                                          e.target.value,
                                          "Coluna Total"
                                        )
                                      }
                                      placeholder="Total"
                                      className="border border-[#D8D3CB] bg-white px-2 py-1.5 text-xs"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Quick Preset Packages + Custom Package Catalog Editor */}
                              <div className="p-3 bg-[#FAF9F6] border border-[#E5E1DA] space-y-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#181716] font-semibold">
                                      Inserir Pacote Rápido (1 Clique)
                                    </p>
                                    <p className="text-[10px] text-[#6B6660]">
                                      Clique para adicionar à fatura ou personalize suas opções favoritas
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingPresetsOpen(!editingPresetsOpen)
                                    }
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.18em] border transition-colors cursor-pointer ${
                                      editingPresetsOpen
                                        ? "bg-[#181716] text-white border-[#181716]"
                                        : "bg-white text-[#181716] border-[#9E8765] hover:bg-[#181716] hover:text-white"
                                    }`}
                                  >
                                    <Settings2 size={11} />
                                    <span>
                                      {editingPresetsOpen
                                        ? "Fechar Editor de Pacotes"
                                        : "Editar Meus Pacotes"}
                                    </span>
                                  </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                  {activeServicePresets.map((p, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => handleAddLineItem(p)}
                                      className="px-2.5 py-1.5 text-[10px] bg-white hover:bg-[#181716] hover:text-white border border-[#D8D3CB] transition-colors cursor-pointer shadow-2xs"
                                    >
                                      + {p.title.split("—")[0].trim()} (
                                      {p.unitPrice}{" "}
                                      {
                                        editorState.documentConfig
                                          .currencySymbol
                                      }
                                      )
                                    </button>
                                  ))}
                                </div>

                                {/* Expandable Custom Package Presets Manager */}
                                {editingPresetsOpen && (
                                  <div className="pt-3 mt-2 border-t border-[#DFDBD2] space-y-3">
                                    <div className="flex items-center justify-between gap-2 flex-wrap bg-[#F2EFE9] px-3 py-2 border-l-2 border-[#9E8765]">
                                      <div>
                                        <p className="text-[9px] uppercase tracking-[0.22em] text-[#181716] font-semibold">
                                          Catálogo de Pacotes & Serviços Preferidos
                                        </p>
                                        <p className="text-[10px] text-[#6B6660]">
                                          Edite os títulos, descrições e valores abaixo. Ao clicar em &ldquo;Salvar Meus Pacotes&rdquo;, estas opções ficarão gravadas como seus botões padrão.
                                        </p>
                                      </div>
                                    </div>

                                    <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                                      {activeServicePresets.map(
                                        (preset, pIdx) => (
                                          <div
                                            key={pIdx}
                                            className="p-3 bg-white border border-[#D8D3CB] space-y-2"
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="text-[9px] uppercase tracking-[0.2em] text-[#9E8765] font-semibold">
                                                 Botão Rápido #{pIdx + 1}
                                              </span>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleMovePresetItem(
                                                      pIdx,
                                                      -1
                                                    )
                                                  }
                                                  disabled={pIdx === 0}
                                                  title="Mover para cima"
                                                  className="p-1 border border-[#D8D3CB] bg-[#FAF9F6] disabled:opacity-30 cursor-pointer"
                                                >
                                                  <ChevronUp size={11} />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleMovePresetItem(
                                                      pIdx,
                                                      1
                                                    )
                                                  }
                                                  disabled={
                                                    pIdx ===
                                                    activeServicePresets.length -
                                                      1
                                                  }
                                                  title="Mover para baixo"
                                                  className="p-1 border border-[#D8D3CB] bg-[#FAF9F6] disabled:opacity-30 cursor-pointer"
                                                >
                                                  <ChevronDown size={11} />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleRemovePresetItem(pIdx)
                                                  }
                                                  disabled={
                                                    activeServicePresets.length <=
                                                    1
                                                  }
                                                  title="Excluir pacote rápido"
                                                  className="p-1 border border-[#D8D3CB] bg-[#FAF9F6] text-red-700 disabled:opacity-30 cursor-pointer"
                                                >
                                                  <Trash2 size={11} />
                                                </button>
                                              </div>
                                            </div>

                                            <div>
                                              <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                                Nome do Pacote / Serviço (use &ldquo;—&rdquo; para subtítulo opcional)
                                              </label>
                                              <input
                                                type="text"
                                                value={preset.title}
                                                onChange={(e) =>
                                                  handleUpdatePresetItem(pIdx, {
                                                    title: e.target.value,
                                                  })
                                                }
                                                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-2.5 py-1.5 text-xs font-medium"
                                              />
                                            </div>

                                            <div>
                                              <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                                Descrição Padrão do Pacote
                                              </label>
                                              <textarea
                                                rows={2}
                                                value={preset.description}
                                                onChange={(e) =>
                                                  handleUpdatePresetItem(pIdx, {
                                                    description: e.target.value,
                                                  })
                                                }
                                                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-2.5 py-1.5 text-xs"
                                              />
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                              <div>
                                                <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                                  Texto Qtd
                                                </label>
                                                <input
                                                  type="text"
                                                  value={preset.quantityLabel}
                                                  onChange={(e) =>
                                                    handleUpdatePresetItem(
                                                      pIdx,
                                                      {
                                                        quantityLabel:
                                                          e.target.value,
                                                      }
                                                    )
                                                  }
                                                  className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-2 py-1 text-xs"
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
                                                  value={preset.quantity}
                                                  onChange={(e) =>
                                                    handleUpdatePresetItem(
                                                      pIdx,
                                                      {
                                                        quantity:
                                                          parseFloat(
                                                            e.target.value
                                                          ) || 1,
                                                      }
                                                    )
                                                  }
                                                  className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-2 py-1 text-xs"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                                  Preço Padrão (
                                                  {
                                                    editorState.documentConfig
                                                      .currencySymbol
                                                  }
                                                  )
                                                </label>
                                                <input
                                                  type="number"
                                                  step="10"
                                                  value={preset.unitPrice}
                                                  onChange={(e) =>
                                                    handleUpdatePresetItem(
                                                      pIdx,
                                                      {
                                                        unitPrice:
                                                          parseFloat(
                                                            e.target.value
                                                          ) || 0,
                                                      }
                                                    )
                                                  }
                                                  className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-2 py-1 text-xs font-medium"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={handleAddPresetItem}
                                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed border-[#9E8765] bg-white hover:bg-[#F6F3EE] text-[#181716] text-[9px] uppercase tracking-[0.18em] cursor-pointer"
                                        >
                                          <Plus size={11} />
                                          <span>Novo Pacote Favorito</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={handleResetPresetItems}
                                          className="px-2.5 py-1.5 border border-[#D8D3CB] bg-white hover:bg-[#F2EFE9] text-[#6B6660] text-[9px] uppercase tracking-[0.16em] cursor-pointer"
                                        >
                                          Restaurar Sugestões
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={handleSavePresetsCatalog}
                                        disabled={isPending}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#181716] text-white hover:bg-[#9E8765] text-[9px] uppercase tracking-[0.2em] transition-colors cursor-pointer"
                                      >
                                        <Save size={12} />
                                        <span>Salvar Meus Pacotes</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Individual Items List */}
                              <div className="space-y-3">
                                {editorState.items.map((item, idx) => (
                                  <div
                                    key={item.id}
                                    className="p-3.5 border border-[#D8D3CB] bg-[#FAF9F6] space-y-2.5"
                                  >
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <span className="text-[9px] uppercase tracking-[0.22em] text-[#9E8765] font-semibold">
                                        Item #{idx + 1} no Documento
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSaveLineItemAsPreset(item)
                                          }
                                          title="Salvar este serviço como um botão de pacote rápido para próximas faturas"
                                          className="inline-flex items-center gap-1 px-2 py-1 border border-[#D8D3CB] bg-white hover:border-[#9E8765] hover:text-[#9E8765] text-[8px] uppercase tracking-[0.16em] transition-colors cursor-pointer mr-1"
                                        >
                                          <Sparkles size={10} />
                                          <span>Salvar nos Pacotes</span>
                                        </button>
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
                                          disabled={
                                            editorState.items.length <= 1
                                          }
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
                                          handleUpdateLineItem(
                                            item.id,
                                            { title: e.target.value },
                                            `Título do Item #${idx + 1}`
                                          )
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
                                          handleUpdateLineItem(
                                            item.id,
                                            { description: e.target.value },
                                            `Descrição do Item #${idx + 1}`
                                          )
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
                                            handleUpdateLineItem(
                                              item.id,
                                              {
                                                quantityLabel: e.target.value,
                                              },
                                              `Qtd do Item #${idx + 1}`
                                            )
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
                                            handleUpdateLineItem(
                                              item.id,
                                              {
                                                quantity:
                                                  parseFloat(e.target.value) ||
                                                  0,
                                              },
                                              `Multiplicador do Item #${idx + 1}`
                                            )
                                          }
                                          className="w-full border border-[#D8D3CB] bg-white px-2.5 py-1.5 text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[8px] uppercase tracking-[0.18em] text-[#6B6660] mb-0.5">
                                          Preço Unit. (
                                          {
                                            editorState.documentConfig
                                              .currencySymbol
                                          }
                                          )
                                        </label>
                                        <input
                                          type="number"
                                          step="10"
                                          value={item.unitPrice}
                                          onChange={(e) =>
                                            handleUpdateLineItem(
                                              item.id,
                                              {
                                                unitPrice:
                                                  parseFloat(e.target.value) ||
                                                  0,
                                              },
                                              `Preço do Item #${idx + 1}`
                                            )
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
                                        e.target.value,
                                        "Rótulo Subtotal"
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
                                        e.target.value,
                                        "Rótulo Total Geral"
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
                                        e.target.checked,
                                        "Desconto (Remise)"
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
                                          e.target.value,
                                          "Rótulo Desconto"
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
                                      onChange={(e) => {
                                        setLastEditedLabel("Valor do Desconto");
                                        setEditorState((prev) => ({
                                          ...prev,
                                          discountAmount:
                                            parseFloat(e.target.value) || 0,
                                        }));
                                      }}
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
                                      updateConfig(
                                        "taxLabel",
                                        e.target.value,
                                        "Rótulo TVA"
                                      )
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
                                    onChange={(e) => {
                                      setLastEditedLabel("Alíquota TVA");
                                      setEditorState((prev) => ({
                                        ...prev,
                                        taxRate:
                                          parseFloat(e.target.value) || 0,
                                      }));
                                    }}
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
                                        e.target.checked,
                                        "Exibição do Sinal (Acompte)"
                                      )
                                    }
                                  />
                                  <span>Exibir Quadro de Sinal (Acompte)</span>
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
                                          editorState.documentConfig
                                            .depositLabel
                                        }
                                        onChange={(e) =>
                                          updateConfig(
                                            "depositLabel",
                                            e.target.value,
                                            "Rótulo do Sinal"
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
                                            editorState.documentConfig
                                              .depositMode
                                          }
                                          onChange={(e) =>
                                            updateConfig(
                                              "depositMode",
                                              e.target.value as
                                                | "percent"
                                                | "fixed",
                                              "Modo do Sinal"
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

                                      {editorState.documentConfig
                                        .depositMode === "percent" ? (
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
                                              updateConfig(
                                                "depositPercent",
                                                pct,
                                                "Percentual do Sinal"
                                              );
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
                                            value={
                                              editorState.fixedDepositAmount
                                            }
                                            onChange={(e) => {
                                              setLastEditedLabel(
                                                "Valor Fixo do Sinal"
                                              );
                                              setEditorState((prev) => ({
                                                ...prev,
                                                fixedDepositAmount:
                                                  parseFloat(e.target.value) ||
                                                  0,
                                              }));
                                            }}
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
                                              e.target.checked,
                                              "Abatimento do Sinal"
                                            )
                                          }
                                        />
                                        <span>
                                          Abater o sinal do Total (exibe sinal
                                          com <code>-</code>)
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
                                              e.target.checked,
                                              "Exibição de Saldo"
                                            )
                                          }
                                        />
                                        <span>
                                          Exibir Linha de Saldo a Pagar (Reste à
                                          payer)
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
                                              e.target.value,
                                              "Rótulo do Saldo"
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
                                    updateConfig(
                                      "taxNoticeText",
                                      e.target.value,
                                      "Menção Legal TVA"
                                    )
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
                                      e.target.value,
                                      "Título de Pagamento"
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
                                      e.target.value,
                                      "Cronograma de Pagamento"
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
                                      e.target.checked,
                                      "Exibição Dados Bancários"
                                    )
                                  }
                                />
                                <span>
                                  Exibir Grade de Coordenadas Bancárias SEPA
                                  (IBAN / BIC)
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
                                        updateConfig(
                                          "bankHolder",
                                          e.target.value,
                                          "Titular Bancário"
                                        )
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
                                      value={
                                        editorState.documentConfig.bankName
                                      }
                                      onChange={(e) =>
                                        updateConfig(
                                          "bankName",
                                          e.target.value,
                                          "Nome do Banco"
                                        )
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
                                      value={
                                        editorState.documentConfig.bankIban
                                      }
                                      onChange={(e) =>
                                        updateConfig(
                                          "bankIban",
                                          e.target.value,
                                          "IBAN"
                                        )
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
                                        updateConfig(
                                          "bankBic",
                                          e.target.value,
                                          "BIC / SWIFT"
                                        )
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
                                      e.target.value,
                                      "Condições de Pagamento"
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
                                    updateConfig(
                                      "atelierTag",
                                      e.target.value,
                                      "Subtítulo Superior"
                                    )
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
                                    updateConfig(
                                      "brandName",
                                      e.target.value,
                                      "Nome da Marca"
                                    )
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
                                  value={
                                    editorState.documentConfig.brandSubtitle
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "brandSubtitle",
                                      e.target.value,
                                      "Especialidades no Topo"
                                    )
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
                                    editorState.documentConfig
                                      .emitterSectionLabel
                                  }
                                  onChange={(e) =>
                                    updateConfig(
                                      "emitterSectionLabel",
                                      e.target.value,
                                      "Título Emissor"
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
                                    updateConfig(
                                      "emitterName",
                                      e.target.value,
                                      "Nome do Fotógrafo"
                                    )
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
                                    updateConfig(
                                      "emitterRole",
                                      e.target.value,
                                      "Profissão do Emissor"
                                    )
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
                                      e.target.value,
                                      "Endereço Profissional"
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
                                      updateConfig(
                                        "emitterEmail",
                                        e.target.value,
                                        "E-mail do Emissor"
                                      )
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
                                        e.target.value,
                                        "Site do Emissor"
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
                                      e.target.value,
                                      "SIRET & Code APE"
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
                                      e.target.checked,
                                      "Quadro de Assinaturas"
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
                                          e.target.value,
                                          "Título Assinatura Fotógrafo"
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
                                          e.target.value,
                                          "Subtítulo Assinatura Fotógrafo"
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
                                          e.target.value,
                                          "Assinatura Cursiva"
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
                                        editorState.documentConfig
                                          .clientSigTitle
                                      }
                                      onChange={(e) =>
                                        updateConfig(
                                          "clientSigTitle",
                                          e.target.value,
                                          "Título Acordo Cliente"
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
                                          e.target.value,
                                          "Instrução Bon pour accord"
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
                                          e.target.value,
                                          "Linha de Data/Assinatura"
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
                                    updateConfig(
                                      "footerLine1",
                                      e.target.value,
                                      "Rodapé Legal — Linha 1"
                                    )
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
                                    updateConfig(
                                      "footerLine2",
                                      e.target.value,
                                      "Rodapé Legal — Linha 2"
                                    )
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

              {/* RIGHT COLUMN: REAL-TIME AUTO-SCALED A4 PREVIEW */}
              <div
                className={`lg:col-span-7 lg:sticky lg:top-4 order-1 lg:order-2 ${
                  mobileEditorView === "form" ? "hidden lg:block" : "block"
                }`}
              >
                <ResponsiveA4PreviewStage
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
                    if (mobileEditorView === "preview") {
                      setMobileEditorView("split");
                    }
                  }}
                  lastEditedLabel={lastEditedLabel}
                  onOpenFullscreen={() => setFullscreenPreviewOpen(true)}
                  onInstantPrint={handleInstantLivePrint}
                />
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: DEFAULT FISCAL & BANK SETTINGS + LIVE A4 PREVIEW             */}
        {/* =================================================================== */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={handleSaveSettings}
              className="lg:col-span-5 bg-white border border-[#E5E1DA] p-6 space-y-6"
            >
              <div className="pb-4 border-b border-[#F2EFE9]">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#9E8765] mb-1">
                  Configurações Padrão de Emissão
                </p>
                <h2 className="font-serif text-2xl text-[#181716]">
                  Meus Dados Fiscais, SIRET &amp; IBAN
                </h2>
                <p className="text-xs text-[#6B6660] font-light mt-1">
                  Altere abaixo e veja o documento ao lado atualizar em tempo
                  real.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                    Nome do Emissor / Fotógrafo
                  </label>
                  <input
                    type="text"
                    value={settings.emitterName}
                    onChange={(e) =>
                      updateSettingsAndSyncPreview(
                        { emitterName: e.target.value },
                        "Nome Padrão do Fotógrafo"
                      )
                    }
                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                    Título Profissional
                  </label>
                  <input
                    type="text"
                    value={settings.emitterRole}
                    onChange={(e) =>
                      updateSettingsAndSyncPreview(
                        { emitterRole: e.target.value },
                        "Título Profissional Padrão"
                      )
                    }
                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                    Linha Fiscal (Entrepreneur Individuel · SIRET · Code APE)
                  </label>
                  <input
                    type="text"
                    value={settings.emitterLegalLine}
                    onChange={(e) =>
                      updateSettingsAndSyncPreview(
                        { emitterLegalLine: e.target.value },
                        "SIRET & Code APE Padrão"
                      )
                    }
                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                    Localização / Endereço Profissional
                  </label>
                  <input
                    type="text"
                    value={settings.emitterLocation}
                    onChange={(e) =>
                      updateSettingsAndSyncPreview(
                        { emitterLocation: e.target.value },
                        "Endereço Profissional Padrão"
                      )
                    }
                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                    Linha de E-mail Profissional
                  </label>
                  <input
                    type="text"
                    value={settings.emitterEmail}
                    onChange={(e) =>
                      updateSettingsAndSyncPreview(
                        { emitterEmail: e.target.value },
                        "E-mail Padrão"
                      )
                    }
                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#F2EFE9] space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                    Titular da Conta Bancária
                  </label>
                  <input
                    type="text"
                    value={settings.bankHolder}
                    onChange={(e) =>
                      updateSettingsAndSyncPreview(
                        { bankHolder: e.target.value },
                        "Titular Bancário Padrão"
                      )
                    }
                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                    Nome do Banco
                  </label>
                  <input
                    type="text"
                    value={settings.bankName}
                    onChange={(e) =>
                      updateSettingsAndSyncPreview(
                        { bankName: e.target.value },
                        "Banco Padrão"
                      )
                    }
                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                    IBAN Oficial
                  </label>
                  <input
                    type="text"
                    value={settings.bankIban}
                    onChange={(e) =>
                      updateSettingsAndSyncPreview(
                        { bankIban: e.target.value },
                        "IBAN Padrão"
                      )
                    }
                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                    BIC / SWIFT
                  </label>
                  <input
                    type="text"
                    value={settings.bankBic}
                    onChange={(e) =>
                      updateSettingsAndSyncPreview(
                        { bankBic: e.target.value },
                        "BIC / SWIFT Padrão"
                      )
                    }
                    className="w-full border border-[#D8D3CB] px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#F2EFE9] grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.18em] text-[#6B6660] mb-1">
                    Acompte (%)
                  </label>
                  <input
                    type="number"
                    value={settings.defaultDepositPercent}
                    onChange={(e) =>
                      updateSettingsAndSyncPreview(
                        {
                          defaultDepositPercent:
                            parseFloat(e.target.value) || 30,
                        },
                        "Percentual Padrão Acompte"
                      )
                    }
                    className="w-full border border-[#D8D3CB] px-2.5 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-[0.18em] text-[#6B6660] mb-1">
                    Próx. Facture
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
                    className="w-full border border-[#D8D3CB] px-2.5 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-[0.18em] text-[#6B6660] mb-1">
                    Próx. Devis
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
                    className="w-full border border-[#D8D3CB] px-2.5 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#F2EFE9] flex items-center justify-between gap-3 bg-[#FAF9F6] p-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#181716] font-semibold">
                    Pacotes & Serviços Fotográficos Favoritos (
                    {activeServicePresets.length})
                  </p>
                  <p className="text-[11px] text-[#6B6660]">
                    Personalize os botões de 1 clique da Seção 04 com seus próprios pacotes e preços.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("editor");
                    setActiveZone("items");
                    setEditingPresetsOpen(true);
                  }}
                  className="px-3 py-2 border border-[#9E8765] bg-white hover:bg-[#181716] hover:text-white text-[9px] uppercase tracking-[0.18em] transition-colors cursor-pointer shrink-0"
                >
                  Editar Meus Pacotes
                </button>
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

            {/* Right Column: Live A4 Preview while editing default settings */}
            <div className="lg:col-span-7 lg:sticky lg:top-4">
              <ResponsiveA4PreviewStage
                docType={editorState.docType}
                docNumber={editorState.docNumber}
                clientName={editorState.clientName}
                items={editorState.items}
                discountAmount={editorState.discountAmount}
                taxRate={editorState.taxRate}
                fixedDepositAmount={editorState.fixedDepositAmount}
                config={editorState.documentConfig}
                activeZone="emitter"
                lastEditedLabel={lastEditedLabel}
                onOpenFullscreen={() => setFullscreenPreviewOpen(true)}
                onInstantPrint={handleInstantLivePrint}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
