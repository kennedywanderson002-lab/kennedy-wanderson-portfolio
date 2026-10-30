"use client";

import React from "react";
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
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Editorial Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <div className="inline-flex items-center space-x-3 mb-4">
            <span className="w-8 h-[1px] bg-[#C5BDB2]" />
            <p className="text-[9px] sm:text-[10px] font-sans uppercase tracking-[0.4em] font-medium text-[#8C8780]">
              {t.about.tagline}
            </p>
            <span className="w-8 h-[1px] bg-[#C5BDB2]" />
          </div>

          <h2 className="font-serif italic text-3xl sm:text-5xl lg:text-6xl font-light text-[#181716] leading-[1.2] mb-6">
            {t.about.subtitle}
          </h2>

          <div className="flex items-center justify-center space-x-2 text-[10px] uppercase tracking-[0.35em] text-[#9E8765] font-sans">
            <span>Kennedy Wanderson</span>
            <span>·</span>
            <span>France & Worldwide</span>
          </div>
        </div>

        {/* Two-Column Editorial Philosophy & Narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start mb-20">
          
          {/* Left Column: Prominent Editorial Pull-Quote */}
          <div className="lg:col-span-5 border-l-2 border-[#181716] pl-6 sm:pl-8 py-2">
            <p className="font-serif italic text-2xl sm:text-3xl text-[#181716] leading-[1.4] font-light">
              &ldquo;{t.about.quote}&rdquo;
            </p>
            <p className="text-[10px] uppercase tracking-[0.3em] font-sans text-[#8C8780] mt-6">
              — {t.about.quoteAuthor}
            </p>
          </div>

          {/* Right Column: Narrative Biography */}
          <div className="lg:col-span-7 space-y-6 text-sm sm:text-base font-light text-[#59534B] leading-[1.9]">
            <p className="first-letter:text-4xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-[#181716]">
              {t.about.paragraph1}
            </p>
            <p>{t.about.paragraph2}</p>
            <p>{t.about.paragraph3}</p>
          </div>
        </div>

        {/* Subtle Career Milestones (Airy Layout) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-12 border-y border-[#EAE6DE]">
          <div className="text-center sm:text-left">
            <p className="font-serif text-3xl sm:text-4xl font-light text-[#181716]">
              {t.about.stats.weddings}
            </p>
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#8C8780] font-sans mt-2">
              {t.about.stats.weddingsLabel}
            </p>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-serif text-3xl sm:text-4xl font-light text-[#181716]">
              {t.about.stats.countries}
            </p>
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#8C8780] font-sans mt-2">
              {t.about.stats.countriesLabel}
            </p>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-serif text-3xl sm:text-4xl font-light text-[#181716]">
              {t.about.stats.experience}
            </p>
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#8C8780] font-sans mt-2">
              {t.about.stats.experienceLabel}
            </p>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-serif text-3xl sm:text-4xl font-light text-[#181716]">
              {t.about.stats.publications}
            </p>
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#8C8780] font-sans mt-2">
              {t.about.stats.publicationsLabel}
            </p>
          </div>
        </div>

        {/* Featured Publications Strip */}
        <div className="mt-16 text-center">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[#9C968F] font-sans font-medium mb-8">
            {t.about.featuredIn}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75">
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
