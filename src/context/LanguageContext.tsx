"use client";

import React, {
  createContext,
  useCallback,
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

let memoryLocale: Locale | null = null;

function isValidLocale(val: string | null | undefined): val is Locale {
  return val === "fr" || val === "en" || val === "pt";
}

function subscribeLocale(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === "kw_locale") {
      memoryLocale = isValidLocale(event.newValue) ? event.newValue : null;
    }
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(LOCALE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LOCALE_EVENT, callback);
  };
}

function getClientLocaleSnapshot(): Locale {
  if (typeof window === "undefined") return "fr";

  if (isValidLocale(memoryLocale)) {
    return memoryLocale;
  }

  try {
    const saved = window.localStorage.getItem("kw_locale");
    if (isValidLocale(saved)) {
      memoryLocale = saved;
      return saved;
    }
  } catch {
    // Ignore storage access errors in private browsing / restricted in-app WebViews
  }

  const browserLang = (window.navigator?.language || "").slice(0, 2).toLowerCase();
  const detected: Locale =
    browserLang === "pt" ? "pt" : browserLang === "fr" ? "fr" : "en";
  memoryLocale = detected;
  return detected;
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

  const setLocale = useCallback((newLocale: Locale) => {
    memoryLocale = newLocale;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("kw_locale", newLocale);
      } catch {
        // Fallback stays active via memoryLocale in restricted mobile WebViews
      }
      if (typeof document !== "undefined") {
        document.documentElement.lang = newLocale;
      }
      window.dispatchEvent(new Event(LOCALE_EVENT));
    }
  }, []);

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
