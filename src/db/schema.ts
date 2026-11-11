import {
  pgTable,
  text,
  boolean,
  integer,
  bigint,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { Locale, Translations } from "@/data/translations";

// ==========================================================
// 1. BETTER AUTH TABLES (E-mail & Password + DB Rate Limiter)
// ==========================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key"),
  count: integer("count"),
  lastRequest: bigint("last_request", { mode: "number" }),
});

// ==========================================================
// 2. HERO SLIDESHOW
// ==========================================================

export const heroSlides = pgTable(
  "hero_slides",
  {
    id: text("id").primaryKey(),
    imageUrl: text("image_url").notNull(),
    blobPathname: text("blob_pathname"),
    titleFr: text("title_fr").notNull(),
    titleEn: text("title_en").notNull(),
    titlePt: text("title_pt").notNull(),
    tag: text("tag").notNull(),
    aspectRatio: text("aspect_ratio").notNull().default("portrait"),
    focalPoint: text("focal_point").notNull().default("50% 0%"),
    sortOrder: integer("sort_order").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("hero_slides_sort_idx").on(table.sortOrder)]
);

// ==========================================================
// 3. PORTFOLIO PROJECTS & LIGHTBOX IMAGES
// ==========================================================

export const portfolioProjects = pgTable(
  "portfolio_projects",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    category: text("category").notNull().default("weddings"),
    titleFr: text("title_fr").notNull(),
    titleEn: text("title_en").notNull(),
    titlePt: text("title_pt").notNull(),
    categoryLabelFr: text("category_label_fr").notNull(),
    categoryLabelEn: text("category_label_en").notNull(),
    categoryLabelPt: text("category_label_pt").notNull(),
    locationFr: text("location_fr").notNull(),
    locationEn: text("location_en").notNull(),
    locationPt: text("location_pt").notNull(),
    descriptionFr: text("description_fr").notNull(),
    descriptionEn: text("description_en").notNull(),
    descriptionPt: text("description_pt").notNull(),
    season: text("season").notNull().default("Été"),
    camera: text("camera").notNull().default(""),
    coverImageUrl: text("cover_image_url").notNull(),
    coverBlobPathname: text("cover_blob_pathname"),
    aspectRatio: text("aspect_ratio").notNull().default("portrait"),
    aspectClass: text("aspect_class").notNull().default("aspect-[4/5]"),
    colSpan: text("col_span").notNull().default("lg:col-span-6"),
    focalPoint: text("focal_point").notNull().default("50% 0%"),
    featured: boolean("featured").notNull().default(true),
    isVisible: boolean("is_visible").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("portfolio_projects_sort_idx").on(table.sortOrder),
    index("portfolio_projects_category_idx").on(table.category),
  ]
);

export const portfolioImages = pgTable(
  "portfolio_images",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => portfolioProjects.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    blobPathname: text("blob_pathname"),
    altText: text("alt_text").default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("portfolio_images_project_idx").on(table.projectId, table.sortOrder),
  ]
);

// ==========================================================
// 4. GLOBAL SITE CONTENT & SETTINGS (SINGLETON id = "main")
// ==========================================================

export type DeepPartialTranslations = Record<
  Locale,
  {
    hero?: Partial<Translations["hero"]>;
    portfolio?: Partial<Translations["portfolio"]>;
    about?: Partial<Translations["about"]>;
    contact?: Partial<
      Omit<Translations["contact"], "form"> & {
        form?: Partial<Translations["contact"]["form"]>;
      }
    >;
    footer?: Partial<Translations["footer"]>;
    mentions?: Partial<Translations["mentions"]>;
  }
>;

export const siteContent = pgTable("site_content", {
  id: text("id").primaryKey().default("main"),
  translationsJson: jsonb("translations_json")
    .$type<DeepPartialTranslations>()
    .notNull(),
  showAboutPortrait: boolean("show_about_portrait").notNull().default(false),
  aboutPortraitUrl: text("about_portrait_url"),
  aboutPortraitBlobPathname: text("about_portrait_blob_pathname"),
  aboutPortraitFocalPoint: text("about_portrait_focal_point")
    .notNull()
    .default("50% 20%"),
  contactEmail: text("contact_email")
    .notNull()
    .default("contact@kennedywanderson.com"),
  whatsappNumber: text("whatsapp_number").notNull().default("33612345678"),
  whatsappDefaultMessage: text("whatsapp_default_message")
    .notNull()
    .default(
      "Bonjour Kennedy, nous découvrons votre portfolio et souhaitons échanger à propos de notre mariage."
    ),
  instagramUrl: text("instagram_url")
    .notNull()
    .default("https://instagram.com"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==========================================================
// 5. CLIENT INQUIRIES / LEADS INBOX
// ==========================================================

export const contactInquiries = pgTable(
  "contact_inquiries",
  {
    id: text("id").primaryKey(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").default(""),
    eventDate: text("event_date").notNull(),
    destination: text("destination").default(""),
    guestCount: text("guest_count").default(""),
    message: text("message").notNull(),
    locale: text("locale").notNull().default("fr"),
    status: text("status").notNull().default("new"), // 'new' | 'contacted' | 'archived'
    notes: text("notes").default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("contact_inquiries_status_idx").on(table.status),
    index("contact_inquiries_created_idx").on(table.createdAt),
  ]
);

// ==========================================================
// 6. FIRST-PARTY SITE ANALYTICS & ENGAGEMENT EVENTS
// ==========================================================

export const siteAnalyticsEvents = pgTable(
  "site_analytics_events",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type").notNull().default("pageview"), // 'pageview' | 'project_open' | 'whatsapp_click' | 'inquiry_submit'
    visitorHash: text("visitor_hash").notNull(),
    pathname: text("pathname").notNull().default("/"),
    deviceType: text("device_type").notNull().default("desktop"), // 'mobile' | 'desktop' | 'tablet'
    locale: text("locale").notNull().default("fr"),
    country: text("country").default(""),
    city: text("city").default(""),
    referrerSource: text("referrer_source").notNull().default("Direto"),
    projectId: text("project_id").default(""),
    projectTitle: text("project_title").default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("analytics_created_at_idx").on(table.createdAt),
    index("analytics_event_type_idx").on(table.eventType),
    index("analytics_visitor_idx").on(table.visitorHash),
  ]
);

// ==========================================================
// 7. BILLING / FACTURES & DEVIS MODULE
// ==========================================================

export interface BillingLineItem {
  id: string;
  title: string;
  description: string;
  quantityLabel: string; // e.g. "1 Forfait", "1 Séance", "Offert"
  quantity: number; // numeric multiplier
  unitPrice: number; // unit price in euros/currency
}

export interface BillingDocumentConfig {
  // Zone 1: Brand Header
  atelierTag: string;
  brandName: string;
  brandSubtitle: string;
  // Zone 2: Document Badge & Status
  docBadgeLabel: string;
  docNumberPrefix: string;
  docStatusBadge: string;
  // Zone 3: Emitter / Prestataire
  emitterSectionLabel: string;
  emitterName: string;
  emitterRole: string;
  emitterLocation: string;
  emitterEmail: string;
  emitterWebsite: string;
  emitterPhone: string;
  emitterLegalLine: string;
  // Zone 4: Client / Facturé à
  clientSectionLabel: string;
  clientAddressLine1: string;
  clientAddressLine2: string;
  clientEmailLine: string;
  clientPhoneLine: string;
  clientExtraLine: string;
  // Zone 5: 4-Column Event Strip
  metaCol1Label: string;
  metaCol1Value: string;
  metaCol2Label: string;
  metaCol2Value: string;
  metaCol3Label: string;
  metaCol3Value: string;
  metaCol4Label: string;
  metaCol4Value: string;
  // Zone 6: Table Headers & Currency
  tableColDesignation: string;
  tableColQty: string;
  tableColUnitPrice: string;
  tableColTotal: string;
  currencySymbol: string;
  // Zone 7: Payment Box & SEPA Bank Details
  paymentBoxTitle: string;
  paymentIntroText: string;
  showBankDetails: boolean;
  bankLabelHolder: string;
  bankHolder: string;
  bankLabelBank: string;
  bankName: string;
  bankLabelIban: string;
  bankIban: string;
  bankLabelBic: string;
  bankBic: string;
  paymentConditionsText: string;
  // Zone 8: Totals, Tax, Deposit & Balance
  subtotalLabel: string;
  showDiscount: boolean;
  discountLabel: string;
  taxLabel: string;
  grandTotalLabel: string;
  showDeposit: boolean;
  depositLabel: string;
  depositMode: "percent" | "fixed";
  depositPercent: number;
  deductDepositFromTotal: boolean;
  showBalanceDue: boolean;
  balanceDueLabel: string;
  taxNoticeText: string;
  // Zone 9: Signatures Block
  showSignatures: boolean;
  photographerSigTitle: string;
  photographerSigSubtitle: string;
  photographerSigName: string;
  clientSigTitle: string;
  clientSigSubtitle: string;
  clientSigDatePrompt: string;
  // Zone 10: Legal Footer
  footerLine1: string;
  footerLine2: string;
}

export interface BillingDefaultSettingsJson {
  atelierTag: string;
  brandName: string;
  brandSubtitle: string;
  emitterName: string;
  emitterRole: string;
  emitterLocation: string;
  emitterEmail: string;
  emitterWebsite: string;
  emitterPhone: string;
  emitterLegalLine: string;
  bankHolder: string;
  bankName: string;
  bankIban: string;
  bankBic: string;
  currencySymbol: string;
  defaultTaxRate: number;
  defaultTaxNotice: string;
  defaultDepositPercent: number;
  defaultInvoiceFooter1: string;
  defaultInvoiceFooter2: string;
  defaultDevisFooter1: string;
  defaultDevisFooter2: string;
  invoicePrefix: string;
  devisPrefix: string;
  nextInvoiceSeq: number;
  nextDevisSeq: number;
  servicePresets?: Array<Omit<BillingLineItem, "id">>;
}

export const billingSettings = pgTable("billing_settings", {
  id: text("id").primaryKey().default("main"),
  settingsJson: jsonb("settings_json")
    .$type<BillingDefaultSettingsJson>()
    .notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const billingDocuments = pgTable(
  "billing_documents",
  {
    id: text("id").primaryKey(),
    docType: text("doc_type").notNull().default("devis"), // 'devis' | 'facture'
    docNumber: text("doc_number").notNull(),
    status: text("status").notNull().default("draft"), // 'draft' | 'sent' | 'accepted' | 'deposit_paid' | 'paid' | 'cancelled'
    inquiryId: text("inquiry_id").default(""),
    clientName: text("client_name").notNull(),
    clientEmail: text("client_email").default(""),
    clientPhone: text("client_phone").default(""),
    eventDate: text("event_date").default(""),
    eventLocation: text("event_location").default(""),
    subtotal: integer("subtotal_cents").notNull().default(0),
    discountAmount: integer("discount_cents").notNull().default(0),
    taxRate: integer("tax_rate_bp").notNull().default(0), // basis points (e.g. 2000 = 20.00%)
    taxAmount: integer("tax_cents").notNull().default(0),
    totalAmount: integer("total_cents").notNull().default(0),
    depositAmount: integer("deposit_cents").notNull().default(0),
    balanceDue: integer("balance_cents").notNull().default(0),
    items: jsonb("items").$type<BillingLineItem[]>().notNull(),
    documentConfig: jsonb("document_config")
      .$type<BillingDocumentConfig>()
      .notNull(),
    notes: text("notes").default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("billing_docs_type_idx").on(table.docType),
    index("billing_docs_status_idx").on(table.status),
    index("billing_docs_created_idx").on(table.createdAt),
  ]
);



