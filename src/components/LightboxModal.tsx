"use client";

import React, { useEffect, useCallback } from "react";
import Image from "next/image";
import { PortfolioProject } from "@/data/portfolio";
import { useLanguage } from "@/context/LanguageContext";
import { X, ChevronLeft, ChevronRight, Camera, MapPin, Calendar } from "lucide-react";

interface LightboxModalProps {
  project: PortfolioProject | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function LightboxModal({ project, onClose, onPrev, onNext }: LightboxModalProps) {
  const { locale, t } = useLanguage();
  const [imageSelection, setImageSelection] = React.useState<{
    projectId: string;
    url: string;
  } | null>(null);

  const activeImage =
    project && imageSelection?.projectId === project.id
      ? imageSelection.url
      : project?.coverImage || "";

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    if (project) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [project, handleKeyDown]);

  if (!project) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-xl p-4 sm:p-6 md:p-8 animate-in fade-in duration-300"
    >
      {/* Background Click to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Close Button Top-Right */}
      <button
        onClick={onClose}
        aria-label={t.portfolio.closeModal}
        className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all duration-200 focus:outline-hidden"
      >
        <X size={22} />
      </button>

      {/* Prev / Next Buttons */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label="Projet précédent"
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 hover:scale-110 transition-all duration-200 focus:outline-hidden"
      >
        <ChevronLeft size={26} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label="Projet suivant"
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 text-white hover:bg-white/25 hover:scale-110 transition-all duration-200 focus:outline-hidden"
      >
        <ChevronRight size={26} />
      </button>

      {/* Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-40 max-w-5xl w-full max-h-[92vh] flex flex-col md:flex-row bg-[#191817] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Photograph Display */}
        <div className="relative flex-1 min-h-[350px] sm:min-h-[480px] md:min-h-[580px] bg-black/60 flex items-center justify-center p-2">
          <Image
            src={activeImage || project.coverImage}
            alt={project.title[locale]}
            fill
            sizes="(max-width: 768px) 100vw, 65vw"
            className="object-contain p-2 sm:p-4 transition-opacity duration-300"
            quality={90}
          />
        </div>

        {/* Narrative & Details Sidebar */}
        <div className="w-full md:w-80 lg:w-96 p-6 sm:p-8 flex flex-col justify-between bg-[#1C1A18] text-[#FAF8F5] border-t md:border-t-0 md:border-l border-white/10 overflow-y-auto">
          <div>
            {/* Category & Season */}
            <div className="flex items-center justify-between text-[10px] tracking-[0.25em] uppercase text-[#BFA989] mb-3">
              <span>{project.categoryLabel[locale]}</span>
              <span className="flex items-center space-x-1 text-white/50">
                <Calendar size={11} />
                <span>{project.season}</span>
              </span>
            </div>

            {/* Title */}
            <h2
              id="modal-title"
              className="font-serif text-2xl sm:text-3xl font-light text-white leading-tight mb-4"
            >
              {project.title[locale]}
            </h2>

            {/* Location */}
            <div className="flex items-center space-x-2 text-xs text-white/70 mb-5 pb-5 border-b border-white/10">
              <MapPin size={14} className="text-[#9E8765] shrink-0" />
              <span>{project.location[locale]}</span>
            </div>

            {/* Narrative description */}
            <p className="text-xs sm:text-sm font-light text-white/80 leading-relaxed mb-6">
              {project.description[locale]}
            </p>

            {/* Gallery Thumbnails Strip */}
            {project.gallery && project.gallery.length > 1 && (
              <div className="mb-6">
                <p className="text-[9px] uppercase tracking-[0.25em] text-white/40 mb-2.5">
                  {locale === "fr"
                    ? "Galerie de la séance"
                    : locale === "pt"
                    ? "Galeria do ensaio"
                    : "Session Gallery"}{" "}
                  ({project.gallery.length})
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {project.gallery.map((imgUrl, i) => (
                    <button
                      key={imgUrl + i}
                      type="button"
                      onClick={() =>
                        setImageSelection({ projectId: project.id, url: imgUrl })
                      }
                      className={`relative w-14 h-14 rounded-md overflow-hidden shrink-0 border transition-all cursor-pointer ${
                        activeImage === imgUrl
                          ? "border-[#BFA989] ring-2 ring-[#BFA989]/40 scale-105"
                          : "border-white/10 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={imgUrl}
                        alt={`Photo ${i + 1}`}
                        fill
                        sizes="60px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Camera / Technical Details Bar */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-start space-x-2.5 text-[11px] text-white/60">
              <Camera size={14} className="text-[#BFA989] shrink-0 mt-0.5" />
              <div>
                <p className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5">
                  {t.portfolio.filmDetails}
                </p>
                <p className="text-white/75 font-mono text-[10px]">
                  {project.camera}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
