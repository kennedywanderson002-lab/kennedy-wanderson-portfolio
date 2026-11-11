import { desc, eq, sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb, isDatabaseConfigured, schema } from "@/db";
import type {
  BillingDefaultSettingsJson,
  BillingDocumentConfig,
  BillingLineItem,
} from "@/db/schema";

export type BillingDocType = "devis" | "facture";
export type BillingDocStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "deposit_paid"
  | "paid"
  | "cancelled";

export interface BillingDocumentItem {
  id: string;
  docType: BillingDocType;
  docNumber: string;
  status: BillingDocStatus;
  inquiryId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string;
  eventLocation: string;
  subtotal: number; // in euros (e.g. 3400)
  discountAmount: number; // in euros
  taxRate: number; // percentage (e.g. 0, 10, 20)
  taxAmount: number; // in euros
  totalAmount: number; // in euros
  depositAmount: number; // in euros
  balanceDue: number; // in euros
  items: BillingLineItem[];
  documentConfig: BillingDocumentConfig;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingDashboardSummary {
  settings: BillingDefaultSettingsJson;
  documents: BillingDocumentItem[];
  kpis: {
    totalInvoiced: number;
    totalDepositsReceived: number;
    totalBalancePending: number;
    openDevisCount: number;
    totalDevisValue: number;
  };
}

export const DEFAULT_BILLING_SETTINGS: BillingDefaultSettingsJson = {
  atelierTag: "Atelier de Photographie Fine Art",
  brandName: "Kennedy Wanderson",
  brandSubtitle: "Mariages · Éditorial · Portraits · France & International",
  emitterName: "Kennedy Wanderson",
  emitterRole: "Photographe Auteur & Reportage Mariage",
  emitterLocation: "Paris & Île-de-France · Déplacements France & Europe",
  emitterEmail: "E-mail : contact@kennedywanderson.com",
  emitterWebsite: "Portfolio : www.kennedywanderson.com",
  emitterPhone: "",
  emitterLegalLine:
    "Entrepreneur Individuel · SIRET : 912 345 678 00019 · APE : 74.20Z",
  bankHolder: "KENNEDY WANDERSON",
  bankName: "QONTO / BNP PARIBAS PARIS",
  bankIban: "FR76 1695 8000 0145 8923 7410 562",
  bankBic: "QNTOFRP1XXX",
  currencySymbol: "€",
  defaultTaxRate: 0,
  defaultTaxNotice:
    "TVA non applicable, art. 293 B du Code général des impôts (CGI).",
  defaultDepositPercent: 30,
  defaultInvoiceFooter1:
    "KENNEDY WANDERSON — PHOTOGRAPHE FINE ART · Paris, France · SIRET : 912 345 678 00019 · Dispensé d'immatriculation au RCS/RM",
  defaultInvoiceFooter2:
    "En cas de retard de paiement, une pénalité égale à 3 fois le taux d'intérêt légal sera exigible (Art. L441-10 du Code de commerce), ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 € (Art. D441-5 du Code de commerce). Pas d'escompte pour paiement anticipé.",
  defaultDevisFooter1:
    "KENNEDY WANDERSON — PHOTOGRAPHE FINE ART · Paris, France · SIRET : 912 345 678 00019 · contact@kennedywanderson.com",
  defaultDevisFooter2:
    "Devis gratuit. La réservation de la date devient ferme et définitive à réception du présent devis signé et du versement de l'acompte de 30 %.",
  invoicePrefix: "FAC",
  devisPrefix: "DEV",
  nextInvoiceSeq: 15,
  nextDevisSeq: 29,
};

export const PHOTOGRAPHY_SERVICE_PRESETS: Array<Omit<BillingLineItem, "id">> = [
  {
    title:
      "Collection Éditoriale « L'Éternité » — Reportage Mariage Complet",
    description:
      "Couverture photographique artistique des préparatifs jusqu'à l'ouverture de bal (12 heures de présence). Tri, étalonnage couleur Fine Art signature et livraison de 650+ photographies haute définition via galerie privée en ligne.",
    quantityLabel: "1 Forfait",
    quantity: 1,
    unitPrice: 2600,
  },
  {
    title: "Collection « Élégance » — Reportage Mariage (8 Heures)",
    description:
      "Présence des préparatifs jusqu'au cocktail (8 heures). Direction artistique naturelle, post-traitement Fine Art et galerie privée en ligne sécurisée (400+ photographies HD).",
    quantityLabel: "1 Forfait",
    quantity: 1,
    unitPrice: 1900,
  },
  {
    title: "Séance Engagement « Save the Date » à Paris",
    description:
      "Séance couple de 2 heures en lumière naturelle avant le mariage · 60 photographies retouchées en Haute Définition.",
    quantityLabel: "1 Séance",
    quantity: 1,
    unitPrice: 450,
  },
  {
    title: "Coffret Fine Art & Tirages d'Art Coton Museum",
    description:
      "Coffret artisanal en lin naturel contenant 30 tirages d'art 13×18 cm sur papier Hahnemühle Photo Rag 308g & clé USB gravée.",
    quantityLabel: "1 Coffret",
    quantity: 1,
    unitPrice: 350,
  },
  {
    title: "Album Fine Art Artisanal 30×30 cm (Papier Coton Mat)",
    description:
      "Mise en page éditoriale sur mesure, couverture en lin naturel embossée à chaud, 40 pages à ouverture à plat.",
    quantityLabel: "1 Album",
    quantity: 1,
    unitPrice: 580,
  },
  {
    title: "Heure Supplémentaire de Présence (Soirée)",
    description:
      "Prolongation de la couverture photographique lors de la soirée dansante.",
    quantityLabel: "1 Heure",
    quantity: 1,
    unitPrice: 220,
  },
  {
    title: "Frais de Déplacement & Logistique (Forfait Île-de-France)",
    description:
      "Déplacement aller-retour sur les lieux des préparatifs, de la cérémonie et de la réception.",
    quantityLabel: "Offert",
    quantity: 1,
    unitPrice: 0,
  },
];

export function formatFrenchDate(dateInput?: Date): string {
  const d = dateInput || new Date();
  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatCurrencyFR(
  amount: number,
  currencySymbol = "€"
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const fixed = Math.abs(safe).toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const spacedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = safe < 0 ? "- " : "";
  return `${sign}${spacedInt},${decPart} ${currencySymbol}`.trim();
}

export function buildDefaultDocumentConfig(
  docType: BillingDocType,
  docNumber: string,
  settings: BillingDefaultSettingsJson = DEFAULT_BILLING_SETTINGS,
  overrides?: Partial<BillingDocumentConfig>
): BillingDocumentConfig {
  const isDevis = docType === "devis";
  const todayStr = formatFrenchDate(new Date());
  const nextMonthDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const validUntilShort = `${String(nextMonthDate.getDate()).padStart(2, "0")}/${String(
    nextMonthDate.getMonth() + 1
  ).padStart(2, "0")}/${nextMonthDate.getFullYear()}`;

  const base: BillingDocumentConfig = {
    atelierTag: settings.atelierTag,
    brandName: settings.brandName,
    brandSubtitle: settings.brandSubtitle,
    docBadgeLabel: isDevis ? "Devis / Proposition" : "Facture",
    docNumberPrefix: "N° ",
    docStatusBadge: isDevis
      ? `Valable jusqu'au ${formatFrenchDate(nextMonthDate)}`
      : `Acompte ${settings.defaultDepositPercent}% Réglé · Solde à Échéance`,
    emitterSectionLabel: isDevis
      ? "Prestataire / Photographe"
      : "Prestataire / Émetteur",
    emitterName: settings.emitterName,
    emitterRole: settings.emitterRole,
    emitterLocation: settings.emitterLocation,
    emitterEmail: settings.emitterEmail,
    emitterWebsite: settings.emitterWebsite,
    emitterPhone: settings.emitterPhone,
    emitterLegalLine: settings.emitterLegalLine,
    clientSectionLabel: isDevis
      ? "Proposition Préparée Pour"
      : "Facturé à / Client",
    clientAddressLine1: "24 Rue de Rivoli",
    clientAddressLine2: "75004 Paris, France",
    clientEmailLine: "E-mail : client@email.fr",
    clientPhoneLine: "Tél : +33 6 00 00 00 00",
    clientExtraLine: isDevis ? "Invités prévus : ~120 personnes" : "",
    metaCol1Label: isDevis ? "Date du Devis" : "Date d'émission",
    metaCol1Value: todayStr,
    metaCol2Label: isDevis
      ? "Date de l'Événement"
      : "Date du Mariage / Séance",
    metaCol2Value: "19 Juin 2027",
    metaCol3Label: isDevis ? "Lieu de Réception" : "Lieu de l'événement",
    metaCol3Value: "Château de Santeny, France",
    metaCol4Label: isDevis ? "Validité de l'offre" : "Échéance de règlement",
    metaCol4Value: isDevis ? `30 Jours (${validUntilShort})` : "05 Juin 2027",
    tableColDesignation: isDevis
      ? "Détail de la Collection Photographique"
      : "Désignation des Prestations",
    tableColQty: "Qté",
    tableColUnitPrice: "Prix Unit. HT",
    tableColTotal: "Total HT",
    currencySymbol: settings.currencySymbol || "€",
    paymentBoxTitle: isDevis
      ? "Échéancier de Réservation"
      : "Modalités & Coordonnées de Règlement",
    paymentIntroText: isDevis
      ? `1. Réservation de la date (${settings.defaultDepositPercent} %) : à la signature du présent devis.\n2. Solde (${100 - settings.defaultDepositPercent} %) : jusqu'à 14 jours avant le mariage.`
      : `Règlement par virement bancaire SEPA en indiquant la référence ${docNumber} :`,
    showBankDetails: true,
    bankLabelHolder: "Titulaire",
    bankHolder: settings.bankHolder,
    bankLabelBank: "Banque",
    bankName: settings.bankName,
    bankLabelIban: "IBAN",
    bankIban: settings.bankIban,
    bankLabelBic: "BIC / SWIFT",
    bankBic: settings.bankBic,
    paymentConditionsText: isDevis
      ? `IBAN : ${settings.bankIban} · Titulaire : ${settings.emitterName}`
      : `Conditions : Acompte de ${settings.defaultDepositPercent} % reçu à la réservation. Solde de ${100 - settings.defaultDepositPercent} % payable au plus tard 14 jours avant la cérémonie.`,
    subtotalLabel: isDevis ? "Total Prestations HT" : "Sous-total HT",
    showDiscount: false,
    discountLabel: "Remise commerciale",
    taxLabel: isDevis
      ? "TVA (Franchise en base)"
      : `TVA (${settings.defaultTaxRate} %)`,
    grandTotalLabel: isDevis ? "Total Devis TTC" : "Total Net TTC",
    showDeposit: true,
    depositLabel: isDevis
      ? `Acompte à la réservation (${settings.defaultDepositPercent} %)`
      : `Acompte versé (${settings.defaultDepositPercent} %)`,
    depositMode: "percent",
    depositPercent: settings.defaultDepositPercent,
    deductDepositFromTotal: !isDevis,
    showBalanceDue: !isDevis,
    balanceDueLabel: "Reste à payer (Solde)",
    taxNoticeText: settings.defaultTaxNotice,
    showSignatures: isDevis,
    photographerSigTitle: "Signature du Photographe",
    photographerSigSubtitle:
      "Engagement de disponibilité & direction artistique",
    photographerSigName: settings.emitterName,
    clientSigTitle: "Bon pour Accord — Les Mariés / Client",
    clientSigSubtitle:
      "Date, signature et mention « Lu et approuvé, bon pour accord » :",
    clientSigDatePrompt: `Date : ____ / ____ / ${new Date().getFullYear()} · Signature :`,
    footerLine1: isDevis
      ? settings.defaultDevisFooter1
      : settings.defaultInvoiceFooter1,
    footerLine2: isDevis
      ? settings.defaultDevisFooter2
      : settings.defaultInvoiceFooter2,
  };

  return {
    ...base,
    ...(overrides || {}),
  };
}

export function applyLanguagePresetToConfig(
  current: BillingDocumentConfig,
  lang: "fr" | "pt" | "en",
  docType: BillingDocType,
  docNumber: string
): BillingDocumentConfig {
  const isDevis = docType === "devis";
  const pct = current.depositPercent || 30;

  if (lang === "pt") {
    return {
      ...current,
      atelierTag: "Atelier de Fotografia Fine Art",
      brandSubtitle: "Casamentos · Editorial · Retratos · França & Internacional",
      docBadgeLabel: isDevis ? "Orçamento / Proposta" : "Fatura",
      docNumberPrefix: "Nº ",
      docStatusBadge: isDevis
        ? "Proposta válida por 30 dias"
        : `Sinal de ${pct}% Pago · Saldo até a Data Limite`,
      emitterSectionLabel: "Prestador / Fotógrafo",
      clientSectionLabel: isDevis ? "Proposta Preparada Para" : "Faturado Para / Cliente",
      metaCol1Label: isDevis ? "Data do Orçamento" : "Data de Emissão",
      metaCol2Label: "Data do Casamento / Ensaio",
      metaCol3Label: "Local do Evento",
      metaCol4Label: isDevis ? "Validade da Proposta" : "Vencimento do Saldo",
      tableColDesignation: "Descrição dos Serviços Fotográficos",
      tableColQty: "Qtd",
      tableColUnitPrice: "Preço Unit.",
      tableColTotal: "Total",
      paymentBoxTitle: isDevis
        ? "Cronograma de Reserva"
        : "Modalidades & Dados Bancários (SEPA)",
      paymentIntroText: isDevis
        ? `1. Reserva da data (${pct}%) : na assinatura deste orçamento.\n2. Saldo (${100 - pct}%) : até 14 dias antes do casamento.`
        : `Pagamento por transferência bancária SEPA indicando a referência ${docNumber} :`,
      bankLabelHolder: "Titular",
      bankLabelBank: "Banco",
      bankLabelIban: "IBAN",
      bankLabelBic: "BIC / SWIFT",
      subtotalLabel: "Subtotal",
      discountLabel: "Desconto Especial",
      taxLabel: "Imposto / TVA (0%)",
      grandTotalLabel: isDevis ? "Total do Orçamento" : "Total Líquido",
      depositLabel: isDevis
        ? `Sinal na reserva (${pct}%)`
        : `Sinal recebido (${pct}%)`,
      balanceDueLabel: "Saldo a Pagar",
      photographerSigTitle: "Assinatura do Fotógrafo",
      photographerSigSubtitle: "Compromisso de disponibilidade & direção artística",
      clientSigTitle: "De Acordo — Noivos / Cliente",
      clientSigSubtitle: "Data, assinatura e menção « Lido e aprovado » :",
      clientSigDatePrompt: `Data : ____ / ____ / ${new Date().getFullYear()} · Assinatura :`,
    };
  }

  if (lang === "en") {
    return {
      ...current,
      atelierTag: "Fine Art Photography Studio",
      brandSubtitle: "Weddings · Editorial · Portraits · France & Worldwide",
      docBadgeLabel: isDevis ? "Proposal / Quote" : "Invoice",
      docNumberPrefix: "No. ",
      docStatusBadge: isDevis
        ? "Proposal valid for 30 days"
        : `${pct}% Retainer Paid · Balance Due Before Event`,
      emitterSectionLabel: "Photographer / Studio",
      clientSectionLabel: isDevis ? "Proposal Prepared For" : "Billed To / Client",
      metaCol1Label: isDevis ? "Proposal Date" : "Issue Date",
      metaCol2Label: "Wedding / Session Date",
      metaCol3Label: "Event Venue & Location",
      metaCol4Label: isDevis ? "Proposal Validity" : "Payment Due Date",
      tableColDesignation: "Description of Photographic Services",
      tableColQty: "Qty",
      tableColUnitPrice: "Unit Price",
      tableColTotal: "Line Total",
      paymentBoxTitle: isDevis
        ? "Booking & Payment Schedule"
        : "SEPA Wire Transfer Details",
      paymentIntroText: isDevis
        ? `1. Date Retainer (${pct}%) : due upon signing this proposal.\n2. Final Balance (${100 - pct}%) : due 14 days prior to the wedding.`
        : `Payment via SEPA bank transfer referencing ${docNumber} :`,
      bankLabelHolder: "Account Holder",
      bankLabelBank: "Bank",
      bankLabelIban: "IBAN",
      bankLabelBic: "BIC / SWIFT",
      subtotalLabel: "Subtotal",
      discountLabel: "Discount",
      taxLabel: "VAT / TVA (0%)",
      grandTotalLabel: isDevis ? "Total Proposal" : "Grand Total",
      depositLabel: isDevis
        ? `Booking Retainer (${pct}%)`
        : `Retainer Paid (${pct}%)`,
      balanceDueLabel: "Balance Due",
      photographerSigTitle: "Photographer's Signature",
      photographerSigSubtitle: "Availability commitment & artistic direction",
      clientSigTitle: "Client Approval & Acceptance",
      clientSigSubtitle: "Date, signature and « Approved and agreed » :",
      clientSigDatePrompt: `Date : ____ / ____ / ${new Date().getFullYear()} · Signature :`,
    };
  }

  // Default French ("fr")
  return {
    ...current,
    atelierTag: "Atelier de Photographie Fine Art",
    brandSubtitle: "Mariages · Éditorial · Portraits · France & International",
    docBadgeLabel: isDevis ? "Devis / Proposition" : "Facture",
    docNumberPrefix: "N° ",
    docStatusBadge: isDevis
      ? "Valable 30 jours à compter de l'émission"
      : `Acompte ${pct}% Réglé · Solde à Échéance`,
    emitterSectionLabel: isDevis
      ? "Prestataire / Photographe"
      : "Prestataire / Émetteur",
    clientSectionLabel: isDevis
      ? "Proposition Préparée Pour"
      : "Facturé à / Client",
    metaCol1Label: isDevis ? "Date du Devis" : "Date d'émission",
    metaCol2Label: isDevis
      ? "Date de l'Événement"
      : "Date du Mariage / Séance",
    metaCol3Label: isDevis ? "Lieu de Réception" : "Lieu de l'événement",
    metaCol4Label: isDevis ? "Validité de l'offre" : "Échéance de règlement",
    tableColDesignation: isDevis
      ? "Détail de la Collection Photographique"
      : "Désignation des Prestations",
    tableColQty: "Qté",
    tableColUnitPrice: "Prix Unit. HT",
    tableColTotal: "Total HT",
    paymentBoxTitle: isDevis
      ? "Échéancier de Réservation"
      : "Modalités & Coordonnées de Règlement",
    paymentIntroText: isDevis
      ? `1. Réservation de la date (${pct} %) : à la signature du présent devis.\n2. Solde (${100 - pct} %) : jusqu'à 14 jours avant le mariage.`
      : `Règlement par virement bancaire SEPA en indiquant la référence ${docNumber} :`,
    bankLabelHolder: "Titulaire",
    bankLabelBank: "Banque",
    bankLabelIban: "IBAN",
    bankLabelBic: "BIC / SWIFT",
    subtotalLabel: isDevis ? "Total Prestations HT" : "Sous-total HT",
    discountLabel: "Remise commerciale",
    taxLabel: isDevis ? "TVA (Franchise en base)" : "TVA (0 %)",
    grandTotalLabel: isDevis ? "Total Devis TTC" : "Total Net TTC",
    depositLabel: isDevis
      ? `Acompte à la réservation (${pct} %)`
      : `Acompte versé (${pct} %)`,
    balanceDueLabel: "Reste à payer (Solde)",
    photographerSigTitle: "Signature du Photographe",
    photographerSigSubtitle: "Engagement de disponibilité & direction artistique",
    clientSigTitle: "Bon pour Accord — Les Mariés / Client",
    clientSigSubtitle:
      "Date, signature et mention « Lu et approuvé, bon pour accord » :",
    clientSigDatePrompt: `Date : ____ / ____ / ${new Date().getFullYear()} · Signature :`,
  };
}

export function calculateBillingTotals(
  items: BillingLineItem[],
  discountAmountInput: number,
  taxRatePercentInput: number,
  config: BillingDocumentConfig,
  fixedDepositInput?: number
): {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  depositAmount: number;
  balanceDue: number;
} {
  const subtotal = items.reduce((acc, item) => {
    const qty = Number.isFinite(item.quantity) ? item.quantity : 1;
    const price = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;
    return acc + qty * price;
  }, 0);

  const discountAmount = config.showDiscount
    ? Math.max(0, Number(discountAmountInput) || 0)
    : 0;
  const netBeforeTax = Math.max(0, subtotal - discountAmount);
  const taxRate = Math.max(0, Number(taxRatePercentInput) || 0);
  const taxAmount = Math.round(netBeforeTax * (taxRate / 100) * 100) / 100;
  const totalAmount = Math.round((netBeforeTax + taxAmount) * 100) / 100;

  let depositAmount = 0;
  if (config.showDeposit) {
    if (config.depositMode === "fixed" && fixedDepositInput !== undefined) {
      depositAmount = Math.max(0, Number(fixedDepositInput) || 0);
    } else {
      const pct = Math.max(0, Number(config.depositPercent) || 0);
      depositAmount = Math.round(totalAmount * (pct / 100) * 100) / 100;
    }
  }

  const balanceDue = config.deductDepositFromTotal
    ? Math.max(0, Math.round((totalAmount - depositAmount) * 100) / 100)
    : totalAmount;

  return {
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
    depositAmount,
    balanceDue,
  };
}

let billingTablesEnsured = false;

export async function ensureBillingTables(): Promise<void> {
  if (billingTablesEnsured || !isDatabaseConfigured()) return;

  try {
    const db = getDb();
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS billing_settings (
        id text PRIMARY KEY DEFAULT 'main',
        settings_json jsonb NOT NULL,
        updated_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS billing_documents (
        id text PRIMARY KEY,
        doc_type text NOT NULL DEFAULT 'devis',
        doc_number text NOT NULL,
        status text NOT NULL DEFAULT 'draft',
        inquiry_id text DEFAULT '',
        client_name text NOT NULL,
        client_email text DEFAULT '',
        client_phone text DEFAULT '',
        event_date text DEFAULT '',
        event_location text DEFAULT '',
        subtotal_cents integer NOT NULL DEFAULT 0,
        discount_cents integer NOT NULL DEFAULT 0,
        tax_rate_bp integer NOT NULL DEFAULT 0,
        tax_cents integer NOT NULL DEFAULT 0,
        total_cents integer NOT NULL DEFAULT 0,
        deposit_cents integer NOT NULL DEFAULT 0,
        balance_cents integer NOT NULL DEFAULT 0,
        items jsonb NOT NULL,
        document_config jsonb NOT NULL,
        notes text DEFAULT '',
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS billing_docs_type_idx ON billing_documents (doc_type);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS billing_docs_status_idx ON billing_documents (status);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS billing_docs_created_idx ON billing_documents (created_at);
    `);

    // Ensure singleton settings row
    const existingSettings = await db
      .select()
      .from(schema.billingSettings)
      .where(eq(schema.billingSettings.id, "main"))
      .limit(1);

    if (existingSettings.length === 0) {
      await db.insert(schema.billingSettings).values({
        id: "main",
        settingsJson: DEFAULT_BILLING_SETTINGS,
      });
    }

    // Seed the 2 approved sample documents (Facture + Devis) if table is empty
    const existingDocs = await db
      .select({ id: schema.billingDocuments.id })
      .from(schema.billingDocuments)
      .limit(1);

    if (existingDocs.length === 0) {
      const sampleItemsFacture: BillingLineItem[] = [
        {
          id: "item-1",
          title:
            "Collection Éditoriale « L'Éternité » — Reportage Mariage Complet",
          description:
            "Couverture photographique artistique des préparatifs jusqu'à l'ouverture de bal (12 heures de présence). Tri, étalonnage couleur Fine Art signature et livraison de 650+ photographies haute définition via galerie privée en ligne.",
          quantityLabel: "1 Forfait",
          quantity: 1,
          unitPrice: 2600,
        },
        {
          id: "item-2",
          title: "Séance Engagement « Save the Date » à Paris",
          description:
            "Séance couple de 2 heures en lumière naturelle avant le mariage · 60 photographies retouchées en Haute Définition.",
          quantityLabel: "1 Séance",
          quantity: 1,
          unitPrice: 450,
        },
        {
          id: "item-3",
          title: "Coffret Fine Art & Tirages d'Art Coton Museum",
          description:
            "Coffret artisanal en lin naturel contenant 30 tirages d'art 13×18 cm sur papier Hahnemühle Photo Rag 308g & clé USB gravée.",
          quantityLabel: "1 Coffret",
          quantity: 1,
          unitPrice: 350,
        },
        {
          id: "item-4",
          title: "Frais de Déplacement & Logistique (Forfait Île-de-France)",
          description:
            "Déplacement aller-retour sur les lieux des préparatifs, de la cérémonie et de la réception.",
          quantityLabel: "Offert",
          quantity: 1,
          unitPrice: 0,
        },
      ];

      const factureConfig = buildDefaultDocumentConfig(
        "facture",
        "FAC-2026-014",
        DEFAULT_BILLING_SETTINGS,
        {
          docStatusBadge: "Acompte 30% Réglé · Solde à Échéance",
          clientAddressLine1: "24 Rue de Rivoli",
          clientAddressLine2: "75004 Paris, France",
          clientEmailLine: "E-mail : camille.julien@email.fr",
          clientPhoneLine: "Tél : +33 6 45 78 12 90",
          metaCol1Value: "11 Novembre 2026",
          metaCol2Value: "19 Juin 2027",
          metaCol3Value: "Château de Santeny, France",
          metaCol4Value: "05 Juin 2027",
          paymentConditionsText:
            "Conditions : Acompte de 30 % (1 020,00 €) reçu le 11/11/2026 à la réservation. Solde de 70 % (2 380,00 €) payable au plus tard 14 jours avant la cérémonie.",
        }
      );

      const devisConfig = buildDefaultDocumentConfig(
        "devis",
        "DEV-2026-028",
        DEFAULT_BILLING_SETTINGS,
        {
          docStatusBadge: "Valable jusqu'au 11 Décembre 2026",
          clientAddressLine1: "24 Rue de Rivoli, 75004 Paris, France",
          clientAddressLine2: "",
          clientEmailLine: "E-mail : camille.julien@email.fr",
          clientPhoneLine: "Tél : +33 6 45 78 12 90",
          clientExtraLine: "Invités prévus : ~120 personnes",
          metaCol1Value: "11 Novembre 2026",
          metaCol2Value: "19 Juin 2027",
          metaCol3Value: "Château de Santeny, France",
          metaCol4Value: "30 Jours (11/12/2026)",
          paymentIntroText:
            "1. Réservation de la date (30 %) : 1 020,00 € à la signature du présent devis.\n2. Solde (70 %) : 2 380,00 € jusqu'à 14 jours avant le mariage.",
          showBankDetails: false,
        }
      );

      await db.insert(schema.billingDocuments).values([
        {
          id: "sample-facture-014",
          docType: "facture",
          docNumber: "FAC-2026-014",
          status: "deposit_paid",
          inquiryId: "",
          clientName: "Camille Laurent & Julien Moreau",
          clientEmail: "camille.julien@email.fr",
          clientPhone: "+33 6 45 78 12 90",
          eventDate: "19 Juin 2027",
          eventLocation: "Château de Santeny, France",
          subtotal: 340000,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          totalAmount: 340000,
          depositAmount: 102000,
          balanceDue: 238000,
          items: sampleItemsFacture,
          documentConfig: factureConfig,
          notes: "Modelo oficial de Facture — você pode editar ou duplicar.",
        },
        {
          id: "sample-devis-028",
          docType: "devis",
          docNumber: "DEV-2026-028",
          status: "sent",
          inquiryId: "",
          clientName: "Camille Laurent & Julien Moreau",
          clientEmail: "camille.julien@email.fr",
          clientPhone: "+33 6 45 78 12 90",
          eventDate: "19 Juin 2027",
          eventLocation: "Château de Santeny, France",
          subtotal: 340000,
          discountAmount: 0,
          taxRate: 0,
          taxAmount: 0,
          totalAmount: 340000,
          depositAmount: 102000,
          balanceDue: 340000,
          items: sampleItemsFacture.slice(0, 3),
          documentConfig: devisConfig,
          notes: "Modelo oficial de Devis — você pode editar ou converter em Facture.",
        },
      ]);
    }

    billingTablesEnsured = true;
  } catch (err) {
    console.warn("[Billing] Aviso ao garantir tabelas:", err);
  }
}

function mapRowToBillingDocument(
  row: typeof schema.billingDocuments.$inferSelect
): BillingDocumentItem {
  return {
    id: row.id,
    docType: row.docType === "facture" ? "facture" : "devis",
    docNumber: row.docNumber,
    status: (row.status as BillingDocStatus) || "draft",
    inquiryId: row.inquiryId || "",
    clientName: row.clientName,
    clientEmail: row.clientEmail || "",
    clientPhone: row.clientPhone || "",
    eventDate: row.eventDate || "",
    eventLocation: row.eventLocation || "",
    subtotal: (row.subtotal || 0) / 100,
    discountAmount: (row.discountAmount || 0) / 100,
    taxRate: (row.taxRate || 0) / 100,
    taxAmount: (row.taxAmount || 0) / 100,
    totalAmount: (row.totalAmount || 0) / 100,
    depositAmount: (row.depositAmount || 0) / 100,
    balanceDue: (row.balanceDue || 0) / 100,
    items: Array.isArray(row.items) ? row.items : [],
    documentConfig: row.documentConfig,
    notes: row.notes || "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getBillingDashboardData(): Promise<BillingDashboardSummary> {
  await connection();

  const empty: BillingDashboardSummary = {
    settings: DEFAULT_BILLING_SETTINGS,
    documents: [],
    kpis: {
      totalInvoiced: 0,
      totalDepositsReceived: 0,
      totalBalancePending: 0,
      openDevisCount: 0,
      totalDevisValue: 0,
    },
  };

  if (!isDatabaseConfigured()) return empty;

  try {
    await ensureBillingTables();
    const db = getDb();

    const [settingsRows, docRows] = await Promise.all([
      db
        .select()
        .from(schema.billingSettings)
        .where(eq(schema.billingSettings.id, "main"))
        .limit(1),
      db
        .select()
        .from(schema.billingDocuments)
        .orderBy(desc(schema.billingDocuments.createdAt)),
    ]);

    const settings: BillingDefaultSettingsJson = settingsRows[0]?.settingsJson
      ? { ...DEFAULT_BILLING_SETTINGS, ...settingsRows[0].settingsJson }
      : DEFAULT_BILLING_SETTINGS;

    const documents = docRows.map(mapRowToBillingDocument);

    let totalInvoiced = 0;
    let totalDepositsReceived = 0;
    let totalBalancePending = 0;
    let openDevisCount = 0;
    let totalDevisValue = 0;

    for (const doc of documents) {
      if (doc.status === "cancelled") continue;

      if (doc.docType === "facture") {
        totalInvoiced += doc.totalAmount;
        if (doc.status === "paid") {
          totalDepositsReceived += doc.totalAmount;
        } else if (doc.status === "deposit_paid") {
          totalDepositsReceived += doc.depositAmount;
          totalBalancePending += doc.balanceDue;
        } else {
          totalBalancePending += doc.totalAmount;
        }
      } else {
        if (doc.status === "draft" || doc.status === "sent") {
          openDevisCount++;
          totalDevisValue += doc.totalAmount;
        }
      }
    }

    return {
      settings,
      documents,
      kpis: {
        totalInvoiced,
        totalDepositsReceived,
        totalBalancePending,
        openDevisCount,
        totalDevisValue,
      },
    };
  } catch (err) {
    console.warn("[Billing] Erro ao carregar dashboard:", err);
    return empty;
  }
}

export async function getBillingDocumentById(
  id: string
): Promise<BillingDocumentItem | null> {
  await connection();
  if (!isDatabaseConfigured() || !id) return null;

  try {
    await ensureBillingTables();
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.billingDocuments)
      .where(eq(schema.billingDocuments.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    return mapRowToBillingDocument(rows[0]);
  } catch (err) {
    console.warn("[Billing] Erro ao buscar documento por ID:", err);
    return null;
  }
}

