import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Sticky Editorial Navbar */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Curated Editorial Portfolio Gallery with Lightbox */}
      <PortfolioGallery />

      {/* Photographer Portrait & Philosophy */}
      <AboutSection />

      {/* Bespoke Inquiry & Contact Section */}
      <ContactSection />

      {/* Luxury Footer with LCEN / GDPR Legal Notice */}
      <Footer />
    </main>
  );
}
