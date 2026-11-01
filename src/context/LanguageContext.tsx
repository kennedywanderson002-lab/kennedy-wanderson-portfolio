"use client";

import React, {
  createContext,
  useContext,
  useSyncExternalStore,
  ReactNode,
} from "react";
import { Locale, Translations, translations } from "@/data/translations";

interface LanguageContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(
  undefined
);

const LOCALE_EVENT = "kw-locale-change";

function subscribeLocale(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(LOCALE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCALE_EVENT, callback);
  };
}

function getClientLocaleSnapshot(): Locale {
  if (typeof window === "undefined") return "fr";
  const saved = window.localStorage.getItem("kw_locale");
  if (saved === "fr" || saved === "en" || saved === "pt") {
    return saved;
  }
  const browserLang = window.navigator.language.slice(0, 2);
  if (browserLang === "pt") return "pt";
  if (browserLang === "fr") return "fr";
  return "en";
}

function getServerLocaleSnapshot(): Locale {
  return "fr";
}

export function LanguageProvider({
  children,
  initialTranslations,
}: {
  children: ReactNode;
  initialTranslations?: Record<Locale, Translations>;
}) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getClientLocaleSnapshot,
    getServerLocaleSnapshot
  );

  const setLocale = (newLocale: Locale) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("kw_locale", newLocale);
      window.dispatchEvent(new Event(LOCALE_EVENT));
    }
  };

  const dictionary = initialTranslations ?? translations;
  const t = dictionary[locale] ?? translations[locale];

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
