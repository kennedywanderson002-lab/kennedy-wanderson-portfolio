"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { getFramedImageStyle } from "@/lib/cms/framing";

interface AboutSectionProps {
  showPortrait?: boolean;
  portraitUrl?: string | null;
  portraitFocalPoint?: string;
}

export function AboutSection({
  showPortrait = false,
  portraitUrl = null,
  portraitFocalPoint = "50% 20%",
}: AboutSectionProps) {
  const { t } = useLanguage();
  const displayPortrait = Boolean(showPortrait && portraitUrl);

  return (
    <section
      id="about"
      className="py-28 sm:py-36 bg-[#FAF9F6] border-t border-[#EFECE6]"
    >
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

        {displayPortrait && portraitUrl ? (
          /* Optional Portrait + Narrative Layout (Only rendered when enabled in Admin) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5 max-w-md mx-auto w-full">
              <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#EDE9E2]">
                <Image
                  src={portraitUrl}
                  alt={t.about.title}
                  fill
                  sizes="(max-width: 1024px) 90vw, 420px"
                  style={getFramedImageStyle(portraitFocalPoint)}
                  className="object-cover"
                  quality={90}
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-6 text-sm sm:text-base font-light text-[#59534B] leading-[1.9] max-w-[65ch]">
                <p className="text-pretty first-letter:text-4xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:leading-none first-letter:text-[#181716]">
                  {t.about.paragraph1}
                </p>
                <p className="text-pretty">{t.about.paragraph2}</p>
                <p className="text-pretty">{t.about.paragraph3}</p>
              </div>

              <figure className="border-l-2 border-[#181716] pl-6 py-1">
                <blockquote className="font-serif italic text-xl sm:text-2xl text-[#181716] leading-[1.45] font-light text-pretty">
                  &ldquo;{t.about.quote}&rdquo;
                </blockquote>
                <figcaption className="text-[0.625rem] uppercase tracking-[0.3em] font-sans text-[#8C8780] mt-4">
                  — <cite className="not-italic">{t.about.quoteAuthor}</cite>
                </figcaption>
              </figure>
            </div>
          </div>
        ) : (
          /* Default Two-Column Editorial Pull-Quote & Biography (Pure Typographic Layout) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
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
        )}
      </div>
    </section>
  );
}
