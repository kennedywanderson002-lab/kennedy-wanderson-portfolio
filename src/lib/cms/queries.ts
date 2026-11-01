import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { getDb, isDatabaseConfigured, schema } from "@/db";
import { isBlobConfigured } from "./blob";
import { defaultHeroSlides, type HeroSlideData } from "@/data/hero";
import { portfolioProjects as defaultPortfolioProjects } from "@/data/portfolio";
import {
  translations as defaultTranslations,
  type Locale,
  type Translations,
} from "@/data/translations";
import {
  legacyObjectPositionToFocalPoint,
  type CmsInquiryItem,
  type CmsPortfolioImage,
  type CmsPortfolioProject,
  type CmsSiteSettings,
} from "./types";
import type { DeepPartialTranslations } from "@/db/schema";

const DEFAULT_SITE_SETTINGS: CmsSiteSettings = {
  translations: defaultTranslations,
  showAboutPortrait: false,
  aboutPortraitUrl: null,
  aboutPortraitBlobPathname: null,
  aboutPortraitFocalPoint: "50% 20%",
  contactEmail: "contact@kennedywanderson.com",
  whatsappNumber: "33612345678",
  whatsappDefaultMessage:
    "Bonjour Kennedy, nous découvrons votre portfolio et souhaitons échanger à propos de notre mariage.",
  instagramUrl: "https://instagram.com",
};

function buildDefaultCmsProjects(): CmsPortfolioProject[] {
  return defaultPortfolioProjects.map((p, index) => ({
    ...p,
    aspectClass:
      p.aspectClass ||
      (p.aspectRatio === "landscape" ? "aspect-[3/2]" : "aspect-[4/5]"),
    colSpan: p.colSpan || "lg:col-span-6",
    focalPoint: legacyObjectPositionToFocalPoint(p.objectPosition),
    coverBlobPathname: null,
    sortOrder: index,
    isVisible: true,
    images: p.gallery.map((imgUrl, imgIndex) => ({
      id: `${p.id}-img-${imgIndex + 1}`,
      imageUrl: imgUrl,
      blobPathname: null,
      altText: p.title.fr,
      sortOrder: imgIndex,
    })),
  }));
}

function mergeLocaleTranslations(
  base: Translations,
  override?: DeepPartialTranslations[Locale]
): Translations {
  if (!override) return base;

  return {
    nav: base.nav,
    hero: { ...base.hero, ...(override.hero || {}) },
    portfolio: { ...base.portfolio, ...(override.portfolio || {}) },
    about: { ...base.about, ...(override.about || {}) },
    contact: {
      ...base.contact,
      ...(override.contact || {}),
      form: {
        ...base.contact.form,
        ...(override.contact?.form || {}),
        destinations:
          override.contact?.form?.destinations?.length
            ? override.contact.form.destinations
            : base.contact.form.destinations,
        guestCountOptions:
          override.contact?.form?.guestCountOptions?.length
            ? override.contact.form.guestCountOptions
            : base.contact.form.guestCountOptions,
      },
    },
    footer: { ...base.footer, ...(override.footer || {}) },
    mentions: { ...base.mentions, ...(override.mentions || {}) },
  };
}

function mapDbHeroRow(
  row: typeof schema.heroSlides.$inferSelect
): HeroSlideData {
  return {
    id: row.id,
    image: row.imageUrl,
    blobPathname: row.blobPathname,
    title: {
      fr: row.titleFr || row.titlePt || row.titleEn,
      en: row.titleEn || row.titleFr || row.titlePt,
      pt: row.titlePt || row.titleFr || row.titleEn,
    },
    tag: row.tag,
    aspectRatio: row.aspectRatio === "landscape" ? "landscape" : "portrait",
    focalPoint: row.focalPoint || "50% 0%",
    sortOrder: row.sortOrder,
    isVisible: row.isVisible,
  };
}

function mapDbProjectRow(
  row: typeof schema.portfolioProjects.$inferSelect,
  images: CmsPortfolioImage[]
): CmsPortfolioProject {
  const validCategory =
    row.category === "weddings" ||
    row.category === "editorials" ||
    row.category === "portraits" ||
    row.category === "details"
      ? row.category
      : "weddings";

  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const galleryUrls =
    sortedImages.length > 0
      ? sortedImages.map((img) => img.imageUrl)
      : [row.coverImageUrl];

  return {
    id: row.id,
    slug: row.slug,
    category: validCategory,
    title: {
      fr: row.titleFr || row.titlePt || row.titleEn,
      en: row.titleEn || row.titleFr || row.titlePt,
      pt: row.titlePt || row.titleFr || row.titleEn,
    },
    categoryLabel: {
      fr: row.categoryLabelFr || row.categoryLabelPt || row.categoryLabelEn,
      en: row.categoryLabelEn || row.categoryLabelFr || row.categoryLabelPt,
      pt: row.categoryLabelPt || row.categoryLabelFr || row.categoryLabelEn,
    },
    location: {
      fr: row.locationFr || row.locationPt || row.locationEn,
      en: row.locationEn || row.locationFr || row.locationPt,
      pt: row.locationPt || row.locationFr || row.locationEn,
    },
    description: {
      fr: row.descriptionFr || row.descriptionPt || row.descriptionEn,
      en: row.descriptionEn || row.descriptionFr || row.descriptionPt,
      pt: row.descriptionPt || row.descriptionFr || row.descriptionEn,
    },
    season: row.season,
    camera: row.camera,
    coverImage: row.coverImageUrl,
    coverBlobPathname: row.coverBlobPathname,
    aspectRatio: row.aspectRatio === "landscape" ? "landscape" : "portrait",
    aspectClass: row.aspectClass || "aspect-[4/5]",
    colSpan: row.colSpan || "lg:col-span-6",
    focalPoint: row.focalPoint || "50% 0%",
    featured: row.featured,
    isVisible: row.isVisible,
    sortOrder: row.sortOrder,
    gallery: galleryUrls,
    images: sortedImages,
  };
}

// ==========================================================
// PUBLIC CACHED QUERIES (Zero-Breakage Static Shell)
// ==========================================================

export async function getCachedHeroSlides(): Promise<HeroSlideData[]> {
  "use cache";
  cacheLife("max");
  cacheTag("cms-hero");

  if (!isDatabaseConfigured()) {
    return defaultHeroSlides;
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.heroSlides)
      .orderBy(asc(schema.heroSlides.sortOrder));

    if (rows.length === 0) {
      return defaultHeroSlides;
    }

    const visible = rows.filter((r) => r.isVisible).map(mapDbHeroRow);
    return visible.length > 0 ? visible : defaultHeroSlides;
  } catch (error) {
    console.warn("[CMS] Fallback para Hero estático:", error);
    return defaultHeroSlides;
  }
}

export async function getCachedPortfolioProjects(): Promise<
  CmsPortfolioProject[]
> {
  "use cache";
  cacheLife("max");
  cacheTag("cms-portfolio");

  if (!isDatabaseConfigured()) {
    return buildDefaultCmsProjects();
  }

  try {
    const db = getDb();
    const [projectRows, imageRows] = await Promise.all([
      db
        .select()
        .from(schema.portfolioProjects)
        .orderBy(asc(schema.portfolioProjects.sortOrder)),
      db
        .select()
        .from(schema.portfolioImages)
        .orderBy(asc(schema.portfolioImages.sortOrder)),
    ]);

    if (projectRows.length === 0) {
      return buildDefaultCmsProjects();
    }

    const imagesByProject = new Map<string, CmsPortfolioImage[]>();
    for (const img of imageRows) {
      const list = imagesByProject.get(img.projectId) || [];
      list.push({
        id: img.id,
        imageUrl: img.imageUrl,
        blobPathname: img.blobPathname,
        altText: img.altText || "",
        sortOrder: img.sortOrder,
      });
      imagesByProject.set(img.projectId, list);
    }

    return projectRows
      .filter((r) => r.isVisible)
      .map((r) => mapDbProjectRow(r, imagesByProject.get(r.id) || []));
  } catch (error) {
    console.warn("[CMS] Fallback para Portfólio estático:", error);
    return buildDefaultCmsProjects();
  }
}

export async function getCachedSiteSettings(): Promise<CmsSiteSettings> {
  "use cache";
  cacheLife("max");
  cacheTag("cms-content");

  if (!isDatabaseConfigured()) {
    return DEFAULT_SITE_SETTINGS;
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.siteContent)
      .where(eq(schema.siteContent.id, "main"));

    if (rows.length === 0) {
      return DEFAULT_SITE_SETTINGS;
    }

    const row = rows[0];
    const json = row.translationsJson || ({} as DeepPartialTranslations);

    return {
      translations: {
        fr: mergeLocaleTranslations(defaultTranslations.fr, json.fr),
        en: mergeLocaleTranslations(defaultTranslations.en, json.en),
        pt: mergeLocaleTranslations(defaultTranslations.pt, json.pt),
      },
      showAboutPortrait: row.showAboutPortrait,
      aboutPortraitUrl: row.aboutPortraitUrl,
      aboutPortraitBlobPathname: row.aboutPortraitBlobPathname,
      aboutPortraitFocalPoint: row.aboutPortraitFocalPoint || "50% 20%",
      contactEmail: row.contactEmail || DEFAULT_SITE_SETTINGS.contactEmail,
      whatsappNumber:
        row.whatsappNumber || DEFAULT_SITE_SETTINGS.whatsappNumber,
      whatsappDefaultMessage:
        row.whatsappDefaultMessage ||
        DEFAULT_SITE_SETTINGS.whatsappDefaultMessage,
      instagramUrl: row.instagramUrl || DEFAULT_SITE_SETTINGS.instagramUrl,
    };
  } catch (error) {
    console.warn("[CMS] Fallback para Site Settings estático:", error);
    return DEFAULT_SITE_SETTINGS;
  }
}

// ==========================================================
// PROTECTED ADMIN QUERIES (Real-time uncached reads)
// ==========================================================

export async function getAdminHeroSlides(): Promise<{
  slides: HeroSlideData[];
  isSeeded: boolean;
}> {
  await connection();
  if (!isDatabaseConfigured()) {
    return { slides: defaultHeroSlides, isSeeded: false };
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.heroSlides)
    .orderBy(asc(schema.heroSlides.sortOrder));

  if (rows.length === 0) {
    return { slides: defaultHeroSlides, isSeeded: false };
  }
  return { slides: rows.map(mapDbHeroRow), isSeeded: true };
}

export async function getAdminPortfolioProjects(): Promise<{
  projects: CmsPortfolioProject[];
  isSeeded: boolean;
}> {
  await connection();
  if (!isDatabaseConfigured()) {
    return { projects: buildDefaultCmsProjects(), isSeeded: false };
  }
  const db = getDb();
  const [projectRows, imageRows] = await Promise.all([
    db
      .select()
      .from(schema.portfolioProjects)
      .orderBy(asc(schema.portfolioProjects.sortOrder)),
    db
      .select()
      .from(schema.portfolioImages)
      .orderBy(asc(schema.portfolioImages.sortOrder)),
  ]);

  if (projectRows.length === 0) {
    return { projects: buildDefaultCmsProjects(), isSeeded: false };
  }

  const imagesByProject = new Map<string, CmsPortfolioImage[]>();
  for (const img of imageRows) {
    const list = imagesByProject.get(img.projectId) || [];
    list.push({
      id: img.id,
      imageUrl: img.imageUrl,
      blobPathname: img.blobPathname,
      altText: img.altText || "",
      sortOrder: img.sortOrder,
    });
    imagesByProject.set(img.projectId, list);
  }

  return {
    projects: projectRows.map((r) =>
      mapDbProjectRow(r, imagesByProject.get(r.id) || [])
    ),
    isSeeded: true,
  };
}

export async function getAdminSiteSettings(): Promise<{
  settings: CmsSiteSettings;
  isSeeded: boolean;
}> {
  await connection();
  if (!isDatabaseConfigured()) {
    return { settings: DEFAULT_SITE_SETTINGS, isSeeded: false };
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.siteContent)
    .where(eq(schema.siteContent.id, "main"));

  if (rows.length === 0) {
    return { settings: DEFAULT_SITE_SETTINGS, isSeeded: false };
  }

  const row = rows[0];
  const json = row.translationsJson || ({} as DeepPartialTranslations);

  return {
    settings: {
      translations: {
        fr: mergeLocaleTranslations(defaultTranslations.fr, json.fr),
        en: mergeLocaleTranslations(defaultTranslations.en, json.en),
        pt: mergeLocaleTranslations(defaultTranslations.pt, json.pt),
      },
      showAboutPortrait: row.showAboutPortrait,
      aboutPortraitUrl: row.aboutPortraitUrl,
      aboutPortraitBlobPathname: row.aboutPortraitBlobPathname,
      aboutPortraitFocalPoint: row.aboutPortraitFocalPoint || "50% 20%",
      contactEmail: row.contactEmail || DEFAULT_SITE_SETTINGS.contactEmail,
      whatsappNumber:
        row.whatsappNumber || DEFAULT_SITE_SETTINGS.whatsappNumber,
      whatsappDefaultMessage:
        row.whatsappDefaultMessage ||
        DEFAULT_SITE_SETTINGS.whatsappDefaultMessage,
      instagramUrl: row.instagramUrl || DEFAULT_SITE_SETTINGS.instagramUrl,
    },
    isSeeded: true,
  };
}

export async function getAdminInquiries(): Promise<CmsInquiryItem[]> {
  await connection();
  if (!isDatabaseConfigured()) {
    return [];
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.contactInquiries)
    .orderBy(desc(schema.contactInquiries.createdAt));

  return rows.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    email: r.email,
    phone: r.phone || "",
    eventDate: r.eventDate,
    destination: r.destination || "",
    guestCount: r.guestCount || "",
    message: r.message,
    locale: r.locale,
    status:
      r.status === "contacted" || r.status === "archived" ? r.status : "new",
    notes: r.notes || "",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getAdminOverviewStats() {
  await connection();
  const dbConnected = isDatabaseConfigured();
  const blobConnected = isBlobConfigured();

  if (!dbConnected) {
    return {
      dbConnected,
      blobConnected,
      isSeeded: false,
      heroCount: defaultHeroSlides.length,
      visibleHeroCount: defaultHeroSlides.length,
      projectsCount: defaultPortfolioProjects.length,
      visibleProjectsCount: defaultPortfolioProjects.length,
      newInquiriesCount: 0,
      totalInquiriesCount: 0,
    };
  }

  const db = getDb();
  const [slides, projects, inquiries] = await Promise.all([
    db.select().from(schema.heroSlides),
    db.select().from(schema.portfolioProjects),
    db.select().from(schema.contactInquiries),
  ]);

  const isSeeded = slides.length > 0 || projects.length > 0;

  return {
    dbConnected,
    blobConnected,
    isSeeded,
    heroCount: isSeeded ? slides.length : defaultHeroSlides.length,
    visibleHeroCount: isSeeded
      ? slides.filter((s) => s.isVisible).length
      : defaultHeroSlides.length,
    projectsCount: isSeeded ? projects.length : defaultPortfolioProjects.length,
    visibleProjectsCount: isSeeded
      ? projects.filter((p) => p.isVisible).length
      : defaultPortfolioProjects.length,
    newInquiriesCount: inquiries.filter((i) => i.status === "new").length,
    totalInquiriesCount: inquiries.length,
  };
}

