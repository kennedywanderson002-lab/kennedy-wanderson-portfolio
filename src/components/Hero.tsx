"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { defaultHeroSlides, type HeroSlideData } from "@/data/hero";
import { getFramedImageStyle, parseImageFraming } from "@/lib/cms/framing";

interface HeroProps {
  slides?: HeroSlideData[];
}

export function Hero({ slides }: HeroProps) {
  const { locale } = useLanguage();
  const activeSlides =
    slides && slides.length > 0 ? slides : defaultHeroSlides;

  const [currentSlide, setCurrentSlide] = useState(0);
  const safeSlideIndex = currentSlide % activeSlides.length;

  // Gentle auto-advance every 6.5 seconds
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? activeSlides.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  return (
    <section
      id="home"
      className="relative w-full h-screen h-[100dvh] overflow-hidden bg-[#141312]"
    >
      {/* Slides with Smooth Crossfade */}
      {activeSlides.map((slide, idx) => {
        const framing = parseImageFraming(slide.focalPoint);
        const desktopUsesCover = framing.desktopFit === "cover";

        return (
          <div
            key={slide.id || slide.image}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              idx === safeSlideIndex
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {/* Ambient Full-Bleed Background (Fills 100% of the screen with glowing atmosphere on Desktop when using contain mode) */}
            {!desktopUsesCover && (
              <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  sizes="100vw"
                  priority={idx === 0}
                  className="object-cover object-center filter blur-3xl opacity-35 scale-110"
                  quality={75}
                />
                {/* Subtle atmospheric vignette over ambient layer */}
                <div className="absolute inset-0 bg-black/40" />
              </div>
            )}

            {/* Main Hero Image: Fills 100% of the screen on mobile (object-cover), respects desktopFit ("contain" or "cover") + focalPoint + zoom */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-0 overflow-hidden">
              <Image
                src={slide.image}
                alt={slide.title[locale]}
                fill
                sizes="100vw"
                priority={idx === 0}
                style={getFramedImageStyle(framing)}
                className={`w-full h-full object-cover ${
                  desktopUsesCover ? "md:object-cover" : "md:object-contain"
                } filter brightness-[0.94] md:brightness-[0.98] transition-transform duration-1000 ease-out`}
                quality={90}
              />
            </div>

            {/* Minimalist Top & Bottom Vignettes for header & caption breathing room */}
            <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none z-15" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none z-15" />
          </div>
        );
      })}

      {/* Thin Minimalist Edge Navigation Arrows (Jose Villa Style) */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 p-3 text-white/75 hover:text-white transition-all duration-300 hover:-translate-x-1 focus:outline-hidden"
          >
            <ChevronLeft size={36} strokeWidth={1} />
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 p-3 text-white/75 hover:text-white transition-all duration-300 hover:translate-x-1 focus:outline-hidden"
          >
            <ChevronRight size={36} strokeWidth={1} />
          </button>
        </>
      )}

      {/* Pure Editorial Bottom Caption & Slide Indicator (Jose Villa Style) */}
      <div className="absolute inset-x-0 bottom-10 z-20 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-8 sm:px-14 text-white">
        {/* Caption */}
        <div className="text-center sm:text-left mb-3 sm:mb-0">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[#EFE8DE]/80 font-sans font-light">
            {activeSlides[safeSlideIndex].tag}
          </p>
          <p className="font-serif italic text-base sm:text-lg text-white font-light tracking-wide mt-0.5">
            {activeSlides[safeSlideIndex].title[locale]}
          </p>
        </div>

        {/* Minimal Slide Indicator (e.g. 01 / 05) */}
        <div className="flex items-center space-x-3 text-[10px] tracking-[0.3em] font-sans text-white/75 font-light">
          <span>{String(safeSlideIndex + 1).padStart(2, "0")}</span>
          <span className="w-8 h-[1px] bg-white/40" />
          <span>{String(activeSlides.length).padStart(2, "0")}</span>
        </div>
      </div>
    </section>
  );
}
