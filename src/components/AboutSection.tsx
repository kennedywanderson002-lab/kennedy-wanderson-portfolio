"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

export function AboutSection() {
  const { t } = useLanguage();

  const publications = [
    "VOGUE WEDDINGS",
    "MARTHA STEWART",
    "HARPER'S BAZAAR",
    "ELLE FRANCE",
    "STYLE ME PRETTY",
    "OVER THE MOON",
  ];

  return (
    <section id="about" className="py-28 sm:py-36 bg-[#FAF9F6] border-t border-[#EFECE6]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Asymmetric Two-Column Editorial Layout (Jose Villa Style) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          
          {/* Photographer Portrait (Pure & Borderless) */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto lg:max-w-none overflow-hidden bg-white">
              <Image
                src="/images/kennedy-wanderson.jpg"
                alt="Portrait of Photographer Kennedy Wanderson"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-top filter brightness-[0.98]"
                quality={90}
              />
            </div>
            <div className="text-center mt-4">
              <p className="font-serif text-lg font-light text-[#181716]">
                Kennedy Wanderson
              </p>
              <p className="text-[9px] uppercase tracking-[0.35em] text-[#8C8780] font-sans mt-0.5">
                France · Worldwide
              </p>
            </div>
          </div>

          {/* Biography & Vision */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-[9px] sm:text-[10px] font-sans uppercase tracking-[0.4em] font-medium text-[#8C8780] mb-4">
              {t.about.tagline}
            </p>
            
            <h2 className="font-serif italic text-3xl sm:text-5xl font-light text-[#181716] leading-[1.25] mb-8">
              {t.about.subtitle}
            </h2>

            {/* Narrative Paragraphs */}
            <div className="space-y-6 text-xs sm:text-sm font-light text-[#59534B] leading-[1.85] max-w-xl">
              <p>{t.about.paragraph1}</p>
              <p>{t.about.paragraph2}</p>
              <p>{t.about.paragraph3}</p>
            </div>

            {/* Quote */}
            <div className="mt-10 pt-8 border-t border-[#EAE6DE] max-w-lg">
              <p className="font-serif italic text-xl sm:text-2xl text-[#181716] leading-relaxed">
                &ldquo;{t.about.quote}&rdquo;
              </p>
              <p className="text-[10px] uppercase tracking-[0.3em] font-sans text-[#8C8780] mt-3">
                — {t.about.quoteAuthor}
              </p>
            </div>

            {/* Subtle Career Milestones (Numbers in Airy Layout) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 pt-8 border-t border-[#EAE6DE]">
              <div>
                <p className="font-serif text-3xl font-light text-[#181716]">
                  {t.about.stats.weddings}
                </p>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8C8780] font-sans mt-1">
                  {t.about.stats.weddingsLabel}
                </p>
              </div>
              <div>
                <p className="font-serif text-3xl font-light text-[#181716]">
                  {t.about.stats.countries}
                </p>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8C8780] font-sans mt-1">
                  {t.about.stats.countriesLabel}
                </p>
              </div>
              <div>
                <p className="font-serif text-3xl font-light text-[#181716]">
                  {t.about.stats.experience}
                </p>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8C8780] font-sans mt-1">
                  {t.about.stats.experienceLabel}
                </p>
              </div>
              <div>
                <p className="font-serif text-3xl font-light text-[#181716]">
                  {t.about.stats.publications}
                </p>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#8C8780] font-sans mt-1">
                  {t.about.stats.publicationsLabel}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Featured Publications Strip */}
        <div className="mt-24 pt-14 border-t border-[#EAE6DE] text-center">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[#9C968F] font-sans font-medium mb-8">
            {t.about.featuredIn}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70">
            {publications.map((pub) => (
              <span
                key={pub}
                className="font-serif text-xs sm:text-sm tracking-[0.25em] uppercase text-[#6B6660]"
              >
                {pub}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
