import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";
import {
  getCachedHeroSlides,
  getCachedPortfolioProjects,
  getCachedSiteSettings,
} from "@/lib/cms/queries";

export default async function Home() {
  const [heroSlides, portfolioProjects, siteSettings] = await Promise.all([
    getCachedHeroSlides(),
    getCachedPortfolioProjects(),
    getCachedSiteSettings(),
  ]);

  return (
    <LanguageProvider initialTranslations={siteSettings.translations}>
      <main className="min-h-screen flex flex-col bg-white">
        {/* Sticky Editorial Navbar */}
        <Navbar
          contactEmail={siteSettings.contactEmail}
          instagramUrl={siteSettings.instagramUrl}
        />

        {/* Hero Section */}
        <Hero slides={heroSlides} />

        {/* Curated Editorial Portfolio Gallery with Lightbox */}
        <PortfolioGallery projects={portfolioProjects} />

        {/* Editorial Biography & Philosophy */}
        <AboutSection
          showPortrait={siteSettings.showAboutPortrait}
          portraitUrl={siteSettings.aboutPortraitUrl}
          portraitFocalPoint={siteSettings.aboutPortraitFocalPoint}
        />

        {/* Bespoke Inquiry & Contact Section */}
        <ContactSection
          contactEmail={siteSettings.contactEmail}
          whatsappNumber={siteSettings.whatsappNumber}
          whatsappDefaultMessage={siteSettings.whatsappDefaultMessage}
        />

        {/* Luxury Footer with LCEN / GDPR Legal Notice */}
        <Footer instagramUrl={siteSettings.instagramUrl} />
      </main>
    </LanguageProvider>
  );
}
