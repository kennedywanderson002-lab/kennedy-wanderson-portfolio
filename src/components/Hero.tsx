"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const heroSlides = [
  {
    image: "/images/real/49390.jpg.jpeg",
    title: {
      fr: "Lumière Dorée & Douceur Poétique · France",
      en: "Golden Hour Glow & Poetic Grace · France",
      pt: "Luz Dourada & Poesia Visual · França",
    },
    tag: "Fine Art Portrait",
    aspectRatio: "portrait",
    objectPosition: "object-top",
  },
  {
    image: "/images/real/39777.jpg.jpeg",
    title: {
      fr: "Falaises d'Étretat · Normandie, France",
      en: "Étretat Sea Cliffs · Normandy, France",
      pt: "Falésias de Étretat · Normandia, França",
    },
    tag: "Destination Session",
    aspectRatio: "portrait",
    objectPosition: "object-[center_32%]",
  },
  {
    image: "/images/real/32772.jpg.jpeg",
    title: {
      fr: "Célébration & Guirlandes Étoilées · France",
      en: "Wedding Celebration & Fairy Lights · France",
      pt: "Celebração de Casamento & Luzes · França",
    },
    tag: "Wedding Celebration",
    aspectRatio: "landscape",
    objectPosition: "object-[center_20%]",
  },
  {
    image: "/images/real/32790.jpg.jpeg",
    title: {
      fr: "Douceur & Voile au Crépuscule · France",
      en: "Bridal Veil & Twilight Romance · France",
      pt: "Véu da Noiva & Romance ao Entardecer · França",
    },
    tag: "Bridal Portrait",
    aspectRatio: "portrait",
    objectPosition: "object-top",
  },
  {
    image: "/images/real/19229.jpg.jpeg",
    title: {
      fr: "Art de Vivre & Ruelles Fleuries · France",
      en: "French Heritage Village & Art de Vivre · France",
      pt: "Vilarejo Histórico & Charme Francês · França",
    },
    tag: "Editorial & Lifestyle",
    aspectRatio: "portrait",
    objectPosition: "object-top",
  },
];

export function Hero() {
  const { locale } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Gentle auto-advance every 6.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  return (
    <section id="home" className="relative w-full h-screen h-[100dvh] overflow-hidden bg-[#141312]">
      {/* Slides with Smooth Crossfade */}
      {heroSlides.map((slide, idx) => (
        <div
          key={slide.image}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          {/* Ambient Full-Bleed Background (Fills 100% of the screen with glowing atmosphere on Desktop) */}
          <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
            <Image
              src={slide.image}
              alt=""
              fill
              sizes="100vw"
              priority={idx === 0}
              className="object-cover object-center filter blur-3xl opacity-35 scale-110"
              quality={60}
            />
            {/* Subtle atmospheric vignette over ambient layer */}
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Main Hero Image: Fills 100% of the screen on mobile (object-cover), preserves full body on desktop (md:object-contain) */}
          <div className="relative z-10 w-full h-full flex items-center justify-center p-0">
            <Image
              src={slide.image}
              alt={slide.title[locale]}
              fill
              sizes="100vw"
              priority={idx === 0}
              className={`w-full h-full object-cover md:object-contain ${slide.objectPosition || "object-top"} filter brightness-[0.94] md:brightness-[0.98] transition-transform duration-1000 ease-out`}
              quality={90}
            />
          </div>

          {/* Minimalist Top & Bottom Vignettes for header & caption breathing room */}
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none z-15" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none z-15" />
        </div>
      ))}

      {/* Thin Minimalist Edge Navigation Arrows (Jose Villa Style) */}
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

      {/* Pure Editorial Bottom Caption & Slide Indicator (Jose Villa Style) */}
      <div className="absolute inset-x-0 bottom-10 z-20 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-8 sm:px-14 text-white">
        {/* Caption */}
        <div className="text-center sm:text-left mb-3 sm:mb-0">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[#EFE8DE]/80 font-sans font-light">
            {heroSlides[currentSlide].tag}
          </p>
          <p className="font-serif italic text-base sm:text-lg text-white font-light tracking-wide mt-0.5">
            {heroSlides[currentSlide].title[locale]}
          </p>
        </div>

        {/* Minimal Slide Indicator (e.g. 01 / 04) */}
        <div className="flex items-center space-x-3 text-[10px] tracking-[0.3em] font-sans text-white/75 font-light">
          <span>0{currentSlide + 1}</span>
          <span className="w-8 h-[1px] bg-white/40" />
          <span>0{heroSlides.length}</span>
        </div>
      </div>
    </section>
  );
}
