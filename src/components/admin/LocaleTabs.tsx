"use client";

import React from "react";
import type { Locale } from "@/data/translations";

interface LocaleTabsProps {
  activeLocale: Locale;
  onChange: (locale: Locale) => void;
  completion?: Partial<Record<Locale, boolean>>;
}

const LOCALES: { code: Locale; label: string; hint: string }[] = [
  { code: "fr", label: "Français (FR)", hint: "Padrão" },
  { code: "pt", label: "Português (PT)", hint: "Brasil/PT" },
  { code: "en", label: "English (EN)", hint: "Internacional" },
];

export function LocaleTabs({
  activeLocale,
  onChange,
  completion,
}: LocaleTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Idioma do conteúdo"
      className="inline-flex flex-wrap items-center gap-1 border border-[#E5E1DA] bg-[#FAF9F6] p-1"
    >
      {LOCALES.map((loc) => {
        const isActive = activeLocale === loc.code;
        const isFilled = completion ? completion[loc.code] : undefined;

        return (
          <button
            key={loc.code}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(loc.code)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer ${
              isActive
                ? "bg-[#181716] text-white font-medium shadow-xs"
                : "text-[#6B6660] hover:text-[#181716] hover:bg-white/70"
            }`}
          >
            <span>{loc.label}</span>
            {isFilled !== undefined && (
              <span
                title={isFilled ? "Preenchido" : "Usará fallback automático do FR"}
                className={`w-1.5 h-1.5 rounded-full ${
                  isFilled
                    ? isActive
                      ? "bg-[#C9B086]"
                      : "bg-emerald-600"
                    : "bg-[#D2CBC3]"
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

