"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function AboutSection() {
  const { t } = useLanguage();

  return (
    <section id="about" className="py-28 sm:py-36 bg-[#FAF9F6] border-t border-[#EFECE6]">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Editorial Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <div className="inline-flex items-center space-x-3 mb-4">
            <span className="w-8 h-[1px] bg-[#C5BDB2]" />
            <p className="text-[0.625rem] font-sans uppercase tracking-[0.4em] font-medium text-[#8C8780]">
              {t.about.tagline}
            </p>
            <span className="w-8 h-[1px] bg-[#C5BDB2]" />
          </div>

          <h2 className="font-serif italic text-[clamp(2rem,1.4rem+2.5vw,3.5rem)] font-light text-[#181716] leading-[1.2] text-balance mb-6">
            {t.about.subtitle}
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[0.625rem] uppercase tracking-[0.35em] text-[#9E8765] font-sans">
            <span>{t.about.title}</span>
            <span aria-hidden="true">·</span>
            <span>{t.about.locationLine}</span>
          </div>
        </div>

        {/* Two-Column Editorial Philosophy & Narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start mb-20 sm:mb-24">
          
          {/* Left Column: Prominent Editorial Pull-Quote */}
          <figure className="lg:col-span-5 border-l-2 border-[#181716] pl-6 sm:pl-8 py-2">
            <blockquote className="font-serif italic text-2xl sm:text-3xl text-[#181716] leading-[1.45] font-light text-pretty">
              &ldquo;{t.about.quote}&rdquo;
            </blockquote>
            <figcaption className="text-[0.625rem] uppercase tracking-[0.3em] font-sans text-[#8C8780] mt-6">
              — <cite className="not-italic">{t.about.quoteAuthor}</cite>
            </figcaption>
          </figure>

          {/* Right Column: Narrative Biography */}
          <div className="lg:col-span-7 space-y-6 text-sm sm:text-base font-light text-[#59534B] leading-[1.9] max-w-[65ch]">
            <p className="text-pretty first-letter:text-4xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-[#181716]">
              {t.about.paragraph1}
            </p>
            <p className="text-pretty">{t.about.paragraph2}</p>
            <p className="text-pretty">{t.about.paragraph3}</p>
          </div>
        </div>

        {/* Authentic Signature Pillars */}
        <div className="pt-14 pb-12 border-y border-[#EAE6DE]">
          <p className="text-[0.625rem] uppercase tracking-[0.38em] text-[#8C8780] font-sans font-medium text-center sm:text-left mb-10">
            {t.about.pillarsTitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {t.about.pillars.map((pillar) => (
              <div key={pillar.number} className="flex flex-col text-center sm:text-left">
                <span className="font-serif italic text-sm text-[#9E8765] tracking-widest mb-2">
                  {pillar.number}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-light text-[#181716] leading-[1.3] text-balance mb-3">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-[0.8125rem] font-light text-[#6B6660] leading-[1.75] text-pretty">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Trilingual Note & Subtle Editorial CTA */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-[0.625rem] uppercase tracking-[0.3em] font-sans text-[#8C8780]">
          <p className="text-center sm:text-left">
            {t.about.languagesLabel}
          </p>

          <Link
            href="#contact"
            className="group inline-flex items-center space-x-1.5 text-[#181716] hover:text-[#9E8765] transition-colors py-1"
          >
            <span className="underline underline-offset-8 decoration-[#C5BDB2] group-hover:decoration-[#9E8765] transition-colors">
              {t.about.ctaLabel}
            </span>
            <ArrowUpRight
              size={13}
              strokeWidth={1.4}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

      </div>
    </section>
  );
}
