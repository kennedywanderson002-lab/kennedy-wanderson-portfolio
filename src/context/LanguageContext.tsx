"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Locale, Translations, translations } from "@/data/translations";

interface LanguageContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    // Check localStorage or browser language
    const saved = localStorage.getItem("kw_locale") as Locale | null;
    if (saved && (saved === "fr" || saved === "en" || saved === "pt")) {
      setLocaleState(saved);
    } else {
      const browserLang = navigator.language.slice(0, 2);
      if (browserLang === "pt") {
        setLocaleState("pt");
      } else if (browserLang === "fr") {
        setLocaleState("fr");
      } else {
        setLocaleState("en");
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("kw_locale", newLocale);
  };

  const t = translations[locale];

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
