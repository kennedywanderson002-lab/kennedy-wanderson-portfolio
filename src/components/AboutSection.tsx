"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import kennedyPortrait from "../../public/images/kennedy-wanderson-portrait.jpg";

export function AboutSection() {
  const { t } = useLanguage();

  return (
    <section id="about" className="py-28 sm:py-36 bg-[#FAF9F6] border-t border-[#EFECE6]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Asymmetric Two-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-24 items-center">
          
          {/* Left Column: Real Upscaled Monochrome Portrait */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[3/4] w-full max-w-md mx-auto lg:max-w-none overflow-hidden bg-[#0E0E0E]">
              <Image
                src={kennedyPortrait}
                alt={`Portrait of Photographer ${t.about.title}`}
                fill
                placeholder="blur"
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-[center_22%]"
                quality={90}
              />
            </div>

            <div className="text-center mt-5">
              <p className="font-serif text-lg font-light text-[#181716]">
                {t.about.title}
              </p>
              <p className="text-[0.625rem] uppercase tracking-[0.35em] text-[#8C8780] font-sans mt-1">
                {t.about.locationLine}
              </p>
            </div>
          </div>

          {/* Right Column: Editorial Biography & Quote */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-[0.625rem] font-sans uppercase tracking-[0.4em] font-medium text-[#8C8780] mb-4">
              {t.about.tagline}
            </p>
            
            <h2 className="font-serif italic text-[clamp(1.875rem,1.4rem+2vw,3.125rem)] font-light text-[#181716] leading-[1.25] text-balance mb-8">
              {t.about.subtitle}
            </h2>

            {/* Narrative Paragraphs */}
            <div className="space-y-6 text-xs sm:text-sm font-light text-[#59534B] leading-[1.9] max-w-[62ch]">
              <p className="text-pretty">{t.about.paragraph1}</p>
              <p className="text-pretty">{t.about.paragraph2}</p>
              <p className="text-pretty">{t.about.paragraph3}</p>
            </div>

            {/* Pull-Quote */}
            <figure className="mt-10 pt-8 border-t border-[#EAE6DE] max-w-[54ch]">
              <blockquote className="font-serif italic text-xl sm:text-2xl text-[#181716] leading-[1.5] font-light text-pretty">
                &ldquo;{t.about.quote}&rdquo;
              </blockquote>
              <figcaption className="text-[0.625rem] uppercase tracking-[0.3em] font-sans text-[#8C8780] mt-3">
                — <cite className="not-italic">{t.about.quoteAuthor}</cite>
              </figcaption>
            </figure>
          </div>

        </div>

      </div>
    </section>
  );
}
