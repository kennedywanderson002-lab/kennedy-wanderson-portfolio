"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Testimonials() {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);

  const items = t.testimonials.items;

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  return (
    <section id="testimonials" className="py-28 sm:py-36 bg-[#FAF9F6] border-t border-[#EFECE6]">
      <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-14 text-center">
        
        {/* Minimal Header */}
        <p className="text-[9px] sm:text-[10px] font-sans uppercase tracking-[0.4em] font-medium text-[#8C8780] mb-4">
          {t.testimonials.tagline}
        </p>
        <h2 className="font-serif italic text-3xl sm:text-5xl font-light text-[#181716] mb-14">
          {t.testimonials.title}
        </h2>

        {/* Flat Minimalist Quote (No Card / No Box) */}
        <div className="relative max-w-3xl mx-auto">
          {/* Poetic Quote in Serif Italic */}
          <blockquote className="font-serif italic text-xl sm:text-2xl md:text-3xl text-[#181716] font-light leading-[1.65] mb-8 min-h-[110px] flex items-center justify-center">
            &ldquo;{items[activeIndex].quote}&rdquo;
          </blockquote>

          {/* Couple & Location */}
          <div className="pt-2 flex flex-col items-center">
            <p className="font-serif text-lg font-light text-[#181716]">
              {items[activeIndex].couple}
            </p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#8C8780] font-sans mt-1">
              {items[activeIndex].location} · {items[activeIndex].date}
            </p>
          </div>

          {/* Minimal Controls */}
          <div className="flex items-center justify-center space-x-6 mt-12">
            <button
              onClick={prevTestimonial}
              aria-label="Témoignage précédent"
              className="p-2 text-[#8C8780] hover:text-[#181716] transition-colors"
            >
              <ChevronLeft size={22} strokeWidth={1.2} />
            </button>

            {/* Subtle Progress Indicator */}
            <div className="flex items-center space-x-2 text-[10px] tracking-[0.25em] font-sans text-[#8C8780]">
              <span>0{activeIndex + 1}</span>
              <span className="w-6 h-[1px] bg-[#D0CAC2]" />
              <span>0{items.length}</span>
            </div>

            <button
              onClick={nextTestimonial}
              aria-label="Témoignage suivant"
              className="p-2 text-[#8C8780] hover:text-[#181716] transition-colors"
            >
              <ChevronRight size={22} strokeWidth={1.2} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
