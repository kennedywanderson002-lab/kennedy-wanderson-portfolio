"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { portfolioProjects, PortfolioProject } from "@/data/portfolio";
import {
  legacyObjectPositionToFocalPoint,
  type CmsPortfolioProject,
} from "@/lib/cms/types";
import { getResponsiveFramedImageStyle } from "@/lib/cms/framing";
import { trackSiteEvent } from "./AnalyticsTracker";
import { LightboxModal } from "./LightboxModal";

interface PortfolioGalleryProps {
  projects?: CmsPortfolioProject[];
}

export function PortfolioGallery({ projects }: PortfolioGalleryProps) {
  const { locale, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<
    number | null
  >(null);

  const activeProjects: (PortfolioProject & { focalPoint?: string })[] =
    useMemo(() => {
      if (projects && projects.length > 0) {
        return projects;
      }
      return portfolioProjects.map((p) => ({
        ...p,
        focalPoint: legacyObjectPositionToFocalPoint(p.objectPosition),
      }));
    }, [projects]);

  const filterTabs = [
    { id: "all", label: t.portfolio.all },
    { id: "weddings", label: t.portfolio.weddings },
    { id: "editorials", label: t.portfolio.editorials },
    { id: "portraits", label: t.portfolio.portraits },
    { id: "details", label: t.portfolio.details },
  ];

  const filteredProjects =
    activeCategory === "all"
      ? activeProjects
      : activeProjects.filter((p) => p.category === activeCategory);

  const openLightbox = (project: PortfolioProject) => {
    const index = activeProjects.findIndex((p) => p.id === project.id);
    setSelectedProjectIndex(index >= 0 ? index : 0);
    trackSiteEvent({
      eventType: "project_open",
      locale,
      projectId: project.id,
      projectTitle: project.title.pt || project.title.fr,
    });
  };

  const handlePrev = () => {
    if (selectedProjectIndex !== null) {
      setSelectedProjectIndex(
        selectedProjectIndex === 0
          ? activeProjects.length - 1
          : selectedProjectIndex - 1
      );
    }
  };

  const handleNext = () => {
    if (selectedProjectIndex !== null) {
      setSelectedProjectIndex(
        selectedProjectIndex === activeProjects.length - 1
          ? 0
          : selectedProjectIndex + 1
      );
    }
  };

  return (
    <section id="portfolio" className="py-28 sm:py-36 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Minimal Section Header (Jose Villa Style) */}
        <div className="text-center max-w-2xl mx-auto mb-20 sm:mb-24">
          <p className="text-[9px] sm:text-[10px] font-sans uppercase tracking-[0.4em] font-medium text-[#8C8780] mb-4">
            {t.portfolio.tagline}
          </p>
          <h2 className="font-serif italic text-3xl sm:text-5xl font-light text-[#181716] mb-5">
            {t.portfolio.title}
          </h2>
          <p className="text-xs sm:text-sm font-light text-[#6B6660] leading-relaxed max-w-lg mx-auto">
            {t.portfolio.subtitle}
          </p>

          {/* Minimalist Filter Text Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-12 text-[10px] tracking-[0.25em] uppercase font-sans">
            {filterTabs.map((tab, idx) => (
              <React.Fragment key={tab.id}>
                <button
                  onClick={() => setActiveCategory(tab.id)}
                  className={`transition-colors duration-200 py-1 ${
                    activeCategory === tab.id
                      ? "text-[#181716] font-semibold underline underline-offset-8 decoration-1"
                      : "text-[#8C8780] hover:text-[#181716]"
                  }`}
                >
                  {tab.label}
                </button>
                {idx < filterTabs.length - 1 && (
                  <span className="text-[#D8D3CB] select-none">/</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Flat & Borderless Editorial Gallery (Jose Villa Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-10 gap-y-16 sm:gap-y-24 items-start">
          {filteredProjects.map((project) => {
            const colSpan = project.colSpan || "lg:col-span-6";
            const aspectClass =
              project.aspectClass ||
              (project.aspectRatio === "landscape"
                ? "aspect-[3/2]"
                : "aspect-[4/5]");
            const focalPoint =
              project.focalPoint ||
              legacyObjectPositionToFocalPoint(project.objectPosition);

            return (
              <div
                key={project.id}
                onClick={() => openLightbox(project)}
                className={`group cursor-pointer ${colSpan} flex flex-col`}
              >
                {/* Pure Photograph without borders or card background */}
                <div
                  className={`relative w-full ${aspectClass} overflow-hidden bg-[#FAF9F6]`}
                >
                  <div className="relative w-full h-full transition-transform duration-1000 ease-out group-hover:scale-[1.03]">
                    <Image
                      src={project.coverImage}
                      alt={project.title[locale]}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                      loading="lazy"
                      style={getResponsiveFramedImageStyle(focalPoint)}
                      className="cms-framed-image object-cover"
                      quality={90}
                    />
                  </div>
                  {/* Gentle hover shimmer */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors duration-500" />
                </div>

                {/* Editorial Typography Underneath (Jose Villa Signature Layout) */}
                <div className="pt-5 text-center sm:text-left">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[#8C8780] font-sans">
                    {project.location[locale]}
                  </p>
                  <h3 className="font-serif italic text-xl sm:text-2xl text-[#181716] font-light mt-1 group-hover:text-[#9E8765] transition-colors">
                    {project.title[locale]}
                  </h3>
                  {project.camera && (
                    <p className="text-[10px] font-mono text-[#9C968F] mt-1 tracking-wider uppercase">
                      {project.camera.split("·")[0]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedProjectIndex !== null &&
        activeProjects[selectedProjectIndex] && (
          <LightboxModal
            project={activeProjects[selectedProjectIndex]}
            onClose={() => setSelectedProjectIndex(null)}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        )}
    </section>
  );
}
