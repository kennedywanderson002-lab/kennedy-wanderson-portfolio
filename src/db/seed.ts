import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { hashPassword } from "better-auth/crypto";
import { getDb, isDatabaseConfigured, schema } from "./index";
import { defaultHeroSlides } from "../data/hero";
import { portfolioProjects as defaultProjects } from "../data/portfolio";
import { translations as defaultTranslations } from "../data/translations";
import { legacyObjectPositionToFocalPoint } from "../lib/cms/types";

async function main() {
  if (!isDatabaseConfigured()) {
    console.error(
      "❌ DATABASE_URL não está configurada em .env.local ou variáveis de ambiente."
    );
    process.exit(1);
  }

  const db = getDb();
  console.log("🌱 Iniciando seed idempotente do banco de dados...");

  // 1. Seed Hero Slides (only if empty, preserving user edits if re-run)
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
    console.log(`✅ ${defaultHeroSlides.length} slides do Hero inseridos.`);
  } else {
    console.log(
      `ℹ️ Hero já possui ${existingHero.length} slide(s) — mantendo dados existentes.`
    );
  }

  // 2. Seed Portfolio Projects & Gallery Images
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
    console.log(
      `✅ ${defaultProjects.length} projetos e respectivas galerias do Portfólio inseridos.`
    );
  } else {
    console.log(
      `ℹ️ Portfólio já possui ${existingProjects.length} projeto(s) — mantendo dados existentes.`
    );
  }

  // 3. Seed Global Site Content Singleton ("main")
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
    console.log("✅ Configurações globais e textos trilíngues inseridos.");
  } else {
    console.log("ℹ️ Configurações globais ('main') já existem — mantendo.");
  }

  // 4. Seed or Reset Initial Admin User
  const adminEmail = (
    process.env.ADMIN_INITIAL_EMAIL || "kennedywanderson002@gmail.com"
  )
    .trim()
    .toLowerCase();
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim();
  const adminName = (
    process.env.ADMIN_INITIAL_NAME || "Kennedy Wanderson"
  ).trim();

  if (!adminPassword || adminPassword.length < 8) {
    console.warn(
      "⚠️ ADMIN_INITIAL_PASSWORD não definida (ou menor que 8 caracteres). Pulando criação automática do usuário admin."
    );
  } else {
    const existingUsers = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, adminEmail));

    if (existingUsers.length === 0) {
      const seedAuth = betterAuth({
        secret:
          process.env.BETTER_AUTH_SECRET ||
          "seed-temporary-secret-min-32-chars-long!",
        database: drizzleAdapter(db, {
          provider: "pg",
          schema,
        }),
        emailAndPassword: {
          enabled: true,
          disableSignUp: false,
        },
      });

      await seedAuth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: adminPassword,
          name: adminName,
        },
      });
      console.log(`✅ Usuário administrador criado com sucesso: ${adminEmail}`);
    } else if (process.env.RESET_ADMIN_PASSWORD === "true") {
      const hashedPassword = await hashPassword(adminPassword);
      await db
        .update(schema.account)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(schema.account.userId, existingUsers[0].id));
      console.log(`🔐 Senha do administrador redefinida para: ${adminEmail}`);
    } else {
      console.log(
        `ℹ️ Administrador (${adminEmail}) já existe. (Use RESET_ADMIN_PASSWORD=true npm run db:seed se desejar redefinir a senha).`
      );
    }
  }

  console.log("🎉 Seed concluído com sucesso!");
}

main().catch((err) => {
  console.error("❌ Erro durante o seed:", err);
  process.exit(1);
});

