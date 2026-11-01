"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, isDatabaseConfigured, schema } from "@/db";
import { getAuth, requireAdmin } from "@/lib/auth";
import { safeDeleteBlob } from "./blob";
import { defaultHeroSlides } from "@/data/hero";
import { portfolioProjects as defaultProjects } from "@/data/portfolio";
import { translations as defaultTranslations } from "@/data/translations";
import { legacyObjectPositionToFocalPoint } from "./types";
import type { DeepPartialTranslations } from "@/db/schema";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `project-${Date.now()}`
  );
}

// ==========================================================
// 0. ONE-CLICK INITIAL IMPORT (If DB is freshly provisioned)
// ==========================================================

export async function initializeCmsFromDefaultsAction() {
  await requireAdmin();
  const db = getDb();

  const existingHero = await db.select().from(schema.heroSlides);
  if (existingHero.length === 0) {
    for (const slide of defaultHeroSlides) {
      await db.insert(schema.heroSlides).values({
        id: slide.id,
        imageUrl: slide.image,
        blobPathname: null,
        titleFr: slide.title.fr,
        titleEn: slide.title.en,
        titlePt: slide.title.pt,
        tag: slide.tag,
        aspectRatio: slide.aspectRatio,
        focalPoint: slide.focalPoint,
        sortOrder: slide.sortOrder,
        isVisible: slide.isVisible,
      });
    }
  }

  const existingProjects = await db.select().from(schema.portfolioProjects);
  if (existingProjects.length === 0) {
    for (let idx = 0; idx < defaultProjects.length; idx++) {
      const p = defaultProjects[idx];
      await db.insert(schema.portfolioProjects).values({
        id: p.id,
        slug: p.slug,
        category: p.category,
        titleFr: p.title.fr,
        titleEn: p.title.en,
        titlePt: p.title.pt,
        categoryLabelFr: p.categoryLabel.fr,
        categoryLabelEn: p.categoryLabel.en,
        categoryLabelPt: p.categoryLabel.pt,
        locationFr: p.location.fr,
        locationEn: p.location.en,
        locationPt: p.location.pt,
        descriptionFr: p.description.fr,
        descriptionEn: p.description.en,
        descriptionPt: p.description.pt,
        season: p.season,
        camera: p.camera,
        coverImageUrl: p.coverImage,
        coverBlobPathname: null,
        aspectRatio: p.aspectRatio,
        aspectClass:
          p.aspectClass ||
          (p.aspectRatio === "landscape" ? "aspect-[3/2]" : "aspect-[4/5]"),
        colSpan: p.colSpan || "lg:col-span-6",
        focalPoint: legacyObjectPositionToFocalPoint(p.objectPosition),
        featured: p.featured,
        isVisible: true,
        sortOrder: idx,
      });

      for (let imgIdx = 0; imgIdx < p.gallery.length; imgIdx++) {
        await db.insert(schema.portfolioImages).values({
          id: `${p.id}-img-${imgIdx + 1}`,
          projectId: p.id,
          imageUrl: p.gallery[imgIdx],
          blobPathname: null,
          altText: p.title.fr,
          sortOrder: imgIdx,
        });
      }
    }
  }

  const existingContent = await db
    .select()
    .from(schema.siteContent)
    .where(eq(schema.siteContent.id, "main"));

  if (existingContent.length === 0) {
    await db.insert(schema.siteContent).values({
      id: "main",
      translationsJson: {
        fr: {
          hero: defaultTranslations.fr.hero,
          portfolio: defaultTranslations.fr.portfolio,
          about: defaultTranslations.fr.about,
          contact: defaultTranslations.fr.contact,
          footer: defaultTranslations.fr.footer,
          mentions: defaultTranslations.fr.mentions,
        },
        en: {
          hero: defaultTranslations.en.hero,
          portfolio: defaultTranslations.en.portfolio,
          about: defaultTranslations.en.about,
          contact: defaultTranslations.en.contact,
          footer: defaultTranslations.en.footer,
          mentions: defaultTranslations.en.mentions,
        },
        pt: {
          hero: defaultTranslations.pt.hero,
          portfolio: defaultTranslations.pt.portfolio,
          about: defaultTranslations.pt.about,
          contact: defaultTranslations.pt.contact,
          footer: defaultTranslations.pt.footer,
          mentions: defaultTranslations.pt.mentions,
        },
      },
      showAboutPortrait: false,
      aboutPortraitUrl: null,
      aboutPortraitBlobPathname: null,
      aboutPortraitFocalPoint: "50% 20%",
      contactEmail: "contact@kennedywanderson.com",
      whatsappNumber: "33612345678",
      whatsappDefaultMessage:
        "Bonjour Kennedy, nous découvrons votre portfolio et souhaitons échanger à propos de notre mariage.",
      instagramUrl: "https://instagram.com",
    });
  }

  updateTag("cms-hero");
  updateTag("cms-portfolio");
  updateTag("cms-content");

  return { ok: true };
}

// ==========================================================
// 1. HERO SLIDES ACTIONS
// ==========================================================

const heroSlideSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().min(1, "A fotografia é obrigatória."),
  blobPathname: z.string().nullable().optional(),
  titleFr: z.string().trim().min(1, "Informe ao menos um título."),
  titleEn: z.string().trim().optional().default(""),
  titlePt: z.string().trim().optional().default(""),
  tag: z.string().trim().min(1, "Informe a etiqueta editorial."),
  aspectRatio: z.enum(["portrait", "landscape"]),
  focalPoint: z.string().trim().default("50% 0%"),
  isVisible: z.boolean().default(true),
});

export async function saveHeroSlideAction(
  input: z.infer<typeof heroSlideSchema>
) {
  await requireAdmin();
  const parsed = heroSlideSchema.parse(input);
  const db = getDb();

  // Auto-ensure Hero table is initialized before first edit
  const existingAll = await db.select().from(schema.heroSlides);
  if (existingAll.length === 0) {
    await initializeCmsFromDefaultsAction();
  }

  const titleFr = parsed.titleFr;
  const titlePt = parsed.titlePt || parsed.titleFr;
  const titleEn = parsed.titleEn || parsed.titleFr;

  if (parsed.id) {
    const prevRows = await db
      .select()
      .from(schema.heroSlides)
      .where(eq(schema.heroSlides.id, parsed.id));

    if (prevRows.length > 0) {
      if (prevRows[0].imageUrl !== parsed.imageUrl) {
        await safeDeleteBlob(prevRows[0].imageUrl);
      }

      await db
        .update(schema.heroSlides)
        .set({
          imageUrl: parsed.imageUrl,
          blobPathname: parsed.blobPathname ?? null,
          titleFr,
          titleEn,
          titlePt,
          tag: parsed.tag,
          aspectRatio: parsed.aspectRatio,
          focalPoint: parsed.focalPoint,
          isVisible: parsed.isVisible,
          updatedAt: new Date(),
        })
        .where(eq(schema.heroSlides.id, parsed.id));

      updateTag("cms-hero");
      return { ok: true, id: parsed.id };
    }
  }

  const currentSlides = await db.select().from(schema.heroSlides);
  const maxOrder = currentSlides.reduce(
    (max, s) => Math.max(max, s.sortOrder),
    -1
  );
  const newId = parsed.id || generateId("hero");

  await db.insert(schema.heroSlides).values({
    id: newId,
    imageUrl: parsed.imageUrl,
    blobPathname: parsed.blobPathname ?? null,
    titleFr,
    titleEn,
    titlePt,
    tag: parsed.tag,
    aspectRatio: parsed.aspectRatio,
    focalPoint: parsed.focalPoint,
    sortOrder: maxOrder + 1,
    isVisible: parsed.isVisible,
  });

  updateTag("cms-hero");
  return { ok: true, id: newId };
}

export async function reorderHeroSlidesAction(orderedIds: string[]) {
  await requireAdmin();
  const ids = z.array(z.string().min(1)).parse(orderedIds);
  const db = getDb();

  const existingAll = await db.select().from(schema.heroSlides);
  if (existingAll.length === 0) {
    await initializeCmsFromDefaultsAction();
  }

  await Promise.all(
    ids.map((id, index) =>
      db
        .update(schema.heroSlides)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(schema.heroSlides.id, id))
    )
  );

  updateTag("cms-hero");
  return { ok: true };
}

export async function toggleHeroSlideVisibilityAction(
  id: string,
  isVisible: boolean
) {
  await requireAdmin();
  const db = getDb();

  const existingAll = await db.select().from(schema.heroSlides);
  if (existingAll.length === 0) {
    await initializeCmsFromDefaultsAction();
  }

  await db
    .update(schema.heroSlides)
    .set({ isVisible, updatedAt: new Date() })
    .where(eq(schema.heroSlides.id, id));

  updateTag("cms-hero");
  return { ok: true };
}

export async function deleteHeroSlideAction(id: string) {
  await requireAdmin();
  const db = getDb();

  const existingAll = await db.select().from(schema.heroSlides);
  if (existingAll.length === 0) {
    await initializeCmsFromDefaultsAction();
  }

  const prev = await db
    .select()
    .from(schema.heroSlides)
    .where(eq(schema.heroSlides.id, id));

  if (prev.length > 0) {
    await safeDeleteBlob(prev[0].imageUrl);
    await db.delete(schema.heroSlides).where(eq(schema.heroSlides.id, id));
  }

  updateTag("cms-hero");
  return { ok: true };
}

// ==========================================================
// 2. PORTFOLIO PROJECTS & GALLERY ACTIONS
// ==========================================================

const portfolioImageInputSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().min(1),
  blobPathname: z.string().nullable().optional(),
  altText: z.string().optional().default(""),
});

const portfolioProjectSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  category: z.enum(["weddings", "editorials", "portraits", "details"]),
  titleFr: z.string().trim().min(1, "Informe o título principal."),
  titleEn: z.string().trim().optional().default(""),
  titlePt: z.string().trim().optional().default(""),
  categoryLabelFr: z.string().trim().min(1, "Informe o subtítulo da categoria."),
  categoryLabelEn: z.string().trim().optional().default(""),
  categoryLabelPt: z.string().trim().optional().default(""),
  locationFr: z.string().trim().min(1, "Informe a localização."),
  locationEn: z.string().trim().optional().default(""),
  locationPt: z.string().trim().optional().default(""),
  descriptionFr: z.string().trim().min(1, "Informe a descrição editorial."),
  descriptionEn: z.string().trim().optional().default(""),
  descriptionPt: z.string().trim().optional().default(""),
  season: z.string().trim().default("Été"),
  camera: z.string().trim().default(""),
  coverImageUrl: z.string().min(1, "A foto de capa é obrigatória."),
  coverBlobPathname: z.string().nullable().optional(),
  aspectRatio: z.enum(["portrait", "landscape"]).default("portrait"),
  aspectClass: z
    .enum(["aspect-[4/5]", "aspect-[3/4]", "aspect-[2/3]", "aspect-[3/2]"])
    .default("aspect-[4/5]"),
  colSpan: z
    .enum([
      "lg:col-span-4",
      "lg:col-span-6",
      "lg:col-span-8",
      "lg:col-span-12",
    ])
    .default("lg:col-span-6"),
  focalPoint: z.string().trim().default("50% 0%"),
  isVisible: z.boolean().default(true),
  images: z.array(portfolioImageInputSchema).min(1, "Adicione ao menos 1 foto."),
});

export async function savePortfolioProjectAction(
  input: z.infer<typeof portfolioProjectSchema>
) {
  await requireAdmin();
  const parsed = portfolioProjectSchema.parse(input);
  const db = getDb();

  const existingAll = await db.select().from(schema.portfolioProjects);
  if (existingAll.length === 0) {
    await initializeCmsFromDefaultsAction();
  }

  const titleFr = parsed.titleFr;
  const titlePt = parsed.titlePt || parsed.titleFr;
  const titleEn = parsed.titleEn || parsed.titleFr;

  const categoryLabelFr = parsed.categoryLabelFr;
  const categoryLabelPt = parsed.categoryLabelPt || parsed.categoryLabelFr;
  const categoryLabelEn = parsed.categoryLabelEn || parsed.categoryLabelFr;

  const locationFr = parsed.locationFr;
  const locationPt = parsed.locationPt || parsed.locationFr;
  const locationEn = parsed.locationEn || parsed.locationFr;

  const descriptionFr = parsed.descriptionFr;
  const descriptionPt = parsed.descriptionPt || parsed.descriptionFr;
  const descriptionEn = parsed.descriptionEn || parsed.descriptionFr;

  const computedRatio =
    parsed.aspectClass === "aspect-[3/2]" ? "landscape" : "portrait";

  let projectId = parsed.id || generateId("proj");
  const baseSlug = slugify(parsed.slug || titleFr);

  const prevRows = parsed.id
    ? await db
        .select()
        .from(schema.portfolioProjects)
        .where(eq(schema.portfolioProjects.id, parsed.id))
    : [];

  if (prevRows.length > 0) {
    projectId = prevRows[0].id;
    const oldImages = await db
      .select()
      .from(schema.portfolioImages)
      .where(eq(schema.portfolioImages.projectId, projectId));

    const retainedUrls = new Set([
      parsed.coverImageUrl,
      ...parsed.images.map((i) => i.imageUrl),
    ]);

    if (!retainedUrls.has(prevRows[0].coverImageUrl)) {
      await safeDeleteBlob(prevRows[0].coverImageUrl);
    }
    for (const oldImg of oldImages) {
      if (!retainedUrls.has(oldImg.imageUrl)) {
        await safeDeleteBlob(oldImg.imageUrl);
      }
    }

    await db
      .update(schema.portfolioProjects)
      .set({
        category: parsed.category,
        titleFr,
        titleEn,
        titlePt,
        categoryLabelFr,
        categoryLabelEn,
        categoryLabelPt,
        locationFr,
        locationEn,
        locationPt,
        descriptionFr,
        descriptionEn,
        descriptionPt,
        season: parsed.season,
        camera: parsed.camera,
        coverImageUrl: parsed.coverImageUrl,
        coverBlobPathname: parsed.coverBlobPathname ?? null,
        aspectRatio: computedRatio,
        aspectClass: parsed.aspectClass,
        colSpan: parsed.colSpan,
        focalPoint: parsed.focalPoint,
        isVisible: parsed.isVisible,
        updatedAt: new Date(),
      })
      .where(eq(schema.portfolioProjects.id, projectId));

    await db
      .delete(schema.portfolioImages)
      .where(eq(schema.portfolioImages.projectId, projectId));
  } else {
    const allProjects = await db.select().from(schema.portfolioProjects);
    const maxOrder = allProjects.reduce(
      (max, p) => Math.max(max, p.sortOrder),
      -1
    );
    const slugExists = allProjects.some((p) => p.slug === baseSlug);
    const uniqueSlug = slugExists
      ? `${baseSlug}-${Date.now().toString(36)}`
      : baseSlug;

    await db.insert(schema.portfolioProjects).values({
      id: projectId,
      slug: uniqueSlug,
      category: parsed.category,
      titleFr,
      titleEn,
      titlePt,
      categoryLabelFr,
      categoryLabelEn,
      categoryLabelPt,
      locationFr,
      locationEn,
      locationPt,
      descriptionFr,
      descriptionEn,
      descriptionPt,
      season: parsed.season,
      camera: parsed.camera,
      coverImageUrl: parsed.coverImageUrl,
      coverBlobPathname: parsed.coverBlobPathname ?? null,
      aspectRatio: computedRatio,
      aspectClass: parsed.aspectClass,
      colSpan: parsed.colSpan,
      focalPoint: parsed.focalPoint,
      featured: true,
      isVisible: parsed.isVisible,
      sortOrder: maxOrder + 1,
    });
  }

  for (let idx = 0; idx < parsed.images.length; idx++) {
    const img = parsed.images[idx];
    await db.insert(schema.portfolioImages).values({
      id: img.id || generateId("pimg"),
      projectId,
      imageUrl: img.imageUrl,
      blobPathname: img.blobPathname ?? null,
      altText: img.altText || titleFr,
      sortOrder: idx,
    });
  }

  updateTag("cms-portfolio");
  return { ok: true, id: projectId };
}

export async function reorderPortfolioProjectsAction(orderedIds: string[]) {
  await requireAdmin();
  const ids = z.array(z.string().min(1)).parse(orderedIds);
  const db = getDb();

  const existingAll = await db.select().from(schema.portfolioProjects);
  if (existingAll.length === 0) {
    await initializeCmsFromDefaultsAction();
  }

  await Promise.all(
    ids.map((id, index) =>
      db
        .update(schema.portfolioProjects)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(schema.portfolioProjects.id, id))
    )
  );

  updateTag("cms-portfolio");
  return { ok: true };
}

export async function togglePortfolioProjectVisibilityAction(
  id: string,
  isVisible: boolean
) {
  await requireAdmin();
  const db = getDb();

  const existingAll = await db.select().from(schema.portfolioProjects);
  if (existingAll.length === 0) {
    await initializeCmsFromDefaultsAction();
  }

  await db
    .update(schema.portfolioProjects)
    .set({ isVisible, updatedAt: new Date() })
    .where(eq(schema.portfolioProjects.id, id));

  updateTag("cms-portfolio");
  return { ok: true };
}

export async function deletePortfolioProjectAction(id: string) {
  await requireAdmin();
  const db = getDb();

  const existingAll = await db.select().from(schema.portfolioProjects);
  if (existingAll.length === 0) {
    await initializeCmsFromDefaultsAction();
  }

  const prev = await db
    .select()
    .from(schema.portfolioProjects)
    .where(eq(schema.portfolioProjects.id, id));
  const oldImages = await db
    .select()
    .from(schema.portfolioImages)
    .where(eq(schema.portfolioImages.projectId, id));

  const urlsToClean = new Set<string>();
  if (prev[0]?.coverImageUrl) urlsToClean.add(prev[0].coverImageUrl);
  for (const img of oldImages) urlsToClean.add(img.imageUrl);

  for (const url of urlsToClean) {
    await safeDeleteBlob(url);
  }

  await db
    .delete(schema.portfolioProjects)
    .where(eq(schema.portfolioProjects.id, id));

  updateTag("cms-portfolio");
  return { ok: true };
}

// ==========================================================
// 3. SITE CONTENT, ABOUT SECTION & CONTACT SETTINGS ACTIONS
// ==========================================================

const siteContentUpdateSchema = z.object({
  translationsJson: z.custom<DeepPartialTranslations>(),
  showAboutPortrait: z.boolean(),
  aboutPortraitUrl: z.string().nullable(),
  aboutPortraitBlobPathname: z.string().nullable().optional(),
  aboutPortraitFocalPoint: z.string().default("50% 20%"),
  contactEmail: z.string().email("E-mail inválido."),
  whatsappNumber: z.string().trim().min(6, "Número de WhatsApp inválido."),
  whatsappDefaultMessage: z.string().trim().min(1),
  instagramUrl: z.string().url("URL do Instagram inválida."),
});

export async function saveSiteContentAction(
  input: z.infer<typeof siteContentUpdateSchema>
) {
  await requireAdmin();
  const parsed = siteContentUpdateSchema.parse(input);
  const db = getDb();

  const existing = await db
    .select()
    .from(schema.siteContent)
    .where(eq(schema.siteContent.id, "main"));

  if (existing.length > 0) {
    if (
      existing[0].aboutPortraitUrl &&
      existing[0].aboutPortraitUrl !== parsed.aboutPortraitUrl
    ) {
      await safeDeleteBlob(existing[0].aboutPortraitUrl);
    }

    await db
      .update(schema.siteContent)
      .set({
        translationsJson: parsed.translationsJson,
        showAboutPortrait: parsed.showAboutPortrait,
        aboutPortraitUrl: parsed.aboutPortraitUrl,
        aboutPortraitBlobPathname: parsed.aboutPortraitBlobPathname ?? null,
        aboutPortraitFocalPoint: parsed.aboutPortraitFocalPoint,
        contactEmail: parsed.contactEmail,
        whatsappNumber: parsed.whatsappNumber.replace(/[^\d]/g, ""),
        whatsappDefaultMessage: parsed.whatsappDefaultMessage,
        instagramUrl: parsed.instagramUrl,
        updatedAt: new Date(),
      })
      .where(eq(schema.siteContent.id, "main"));
  } else {
    await db.insert(schema.siteContent).values({
      id: "main",
      translationsJson: parsed.translationsJson,
      showAboutPortrait: parsed.showAboutPortrait,
      aboutPortraitUrl: parsed.aboutPortraitUrl,
      aboutPortraitBlobPathname: parsed.aboutPortraitBlobPathname ?? null,
      aboutPortraitFocalPoint: parsed.aboutPortraitFocalPoint,
      contactEmail: parsed.contactEmail,
      whatsappNumber: parsed.whatsappNumber.replace(/[^\d]/g, ""),
      whatsappDefaultMessage: parsed.whatsappDefaultMessage,
      instagramUrl: parsed.instagramUrl,
    });
  }

  updateTag("cms-content");
  return { ok: true };
}

// ==========================================================
// 4. PUBLIC CONTACT FORM SUBMISSION & ADMIN INBOX ACTIONS
// ==========================================================

const publicInquirySchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().max(60).optional().default(""),
  eventDate: z.string().trim().min(2).max(120),
  destination: z.string().trim().max(160).optional().default(""),
  guestCount: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(5).max(4000),
  locale: z.enum(["fr", "en", "pt"]).default("fr"),
  websiteHoneypot: z.string().optional().default(""), // Anti-bot honeypot
});

export async function submitContactInquiryAction(
  input: z.infer<typeof publicInquirySchema>
) {
  const parsed = publicInquirySchema.parse(input);

  // Silent drop for spam bots filling the hidden honeypot field
  if (parsed.websiteHoneypot.trim().length > 0) {
    return { ok: true };
  }

  if (!isDatabaseConfigured()) {
    return { ok: true, stored: false };
  }

  try {
    const db = getDb();
    await db.insert(schema.contactInquiries).values({
      id: generateId("inq"),
      fullName: parsed.fullName,
      email: parsed.email,
      phone: parsed.phone,
      eventDate: parsed.eventDate,
      destination: parsed.destination,
      guestCount: parsed.guestCount,
      message: parsed.message,
      locale: parsed.locale,
      status: "new",
      notes: "",
    });
    return { ok: true, stored: true };
  } catch (error) {
    console.error("[Contact Inquiry] Erro ao salvar mensagem:", error);
    return { ok: true, stored: false };
  }
}

export async function updateInquiryStatusAction(
  id: string,
  status: "new" | "contacted" | "archived",
  notes?: string
) {
  await requireAdmin();
  const db = getDb();

  await db
    .update(schema.contactInquiries)
    .set({
      status,
      ...(notes !== undefined ? { notes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.contactInquiries.id, id));

  return { ok: true };
}

export async function deleteInquiryAction(id: string) {
  await requireAdmin();
  const db = getDb();
  await db
    .delete(schema.contactInquiries)
    .where(eq(schema.contactInquiries.id, id));
  return { ok: true };
}

// ==========================================================
// 5. ADMIN PASSWORD CHANGE
// ==========================================================

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "A nova senha deve ter pelo menos 8 caracteres."),
});

export async function changeAdminPasswordAction(
  input: z.infer<typeof passwordChangeSchema>
) {
  await requireAdmin();
  const parsed = passwordChangeSchema.parse(input);

  const auth = getAuth();
  await auth.api.changePassword({
    body: {
      currentPassword: parsed.currentPassword,
      newPassword: parsed.newPassword,
      revokeOtherSessions: true,
    },
    headers: await headers(),
  });

  return { ok: true };
}

