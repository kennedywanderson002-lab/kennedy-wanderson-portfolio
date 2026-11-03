"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Locale } from "@/data/translations";
import { X } from "lucide-react";

interface NavbarProps {
  contactEmail?: string;
  instagramUrl?: string;
}

const LANGUAGES: { code: Locale; short: string; name: string }[] = [
  { code: "fr", short: "FR", name: "Français" },
  { code: "pt", short: "PT", name: "Português" },
  { code: "en", short: "EN", name: "English" },
];

export function Navbar({
  contactEmail = "contact@kennedywanderson.com",
  instagramUrl = "https://instagram.com",
}: NavbarProps) {
  const { locale, setLocale, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const rawId = useId();
  const drawerId = `kw-nav-drawer-${rawId.replace(/:/g, "")}`;
  const triggerId = `kw-nav-trigger-${rawId.replace(/:/g, "")}`;

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const hasEnteredRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const setMainInert = useCallback((inertValue: boolean) => {
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.inert = inertValue;
    }
    document.body.style.overflow = inertValue ? "hidden" : "";
  }, []);

  const finalizeClosed = useCallback(() => {
    const drawer = drawerRef.current;
    if (drawer) {
      if (typeof drawer.hidePopover === "function") {
        try {
          if (drawer.matches(":popover-open")) {
            drawer.hidePopover();
          }
        } catch {
          // Ignore if already hidden
        }
      } else {
        drawer.classList.remove("is-fallback-open");
        drawer.classList.add("is-fallback-closed");
      }
    }
    hasEnteredRef.current = false;
    setMainInert(false);
    setMenuOpen(false);
  }, [setMainInert]);

  const openDrawer = useCallback(async () => {
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    if (!drawer || !scroller) return;

    hasEnteredRef.current = false;

    if (typeof drawer.showPopover === "function") {
      if (!drawer.matches(":popover-open")) {
        drawer.showPopover();
      }
    } else {
      drawer.classList.remove("is-fallback-closed");
      drawer.classList.add("is-fallback-open");
    }

    if (
      typeof CSS === "undefined" ||
      !CSS.supports("scroll-initial-target", "nearest")
    ) {
      scroller.scrollTo({ left: scroller.offsetWidth, behavior: "instant" });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
    }

    setMenuOpen(true);
    scroller.scrollTo({ left: 0, behavior: "auto" });
  }, []);

  const closeDrawer = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      finalizeClosed();
      return;
    }

    if (!hasEnteredRef.current) {
      finalizeClosed();
      return;
    }

    scroller.scrollTo({ left: scroller.offsetWidth, behavior: "auto" });
  }, [finalizeClosed]);

  useEffect(() => {
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!drawer || !scroller || !sheet) return;

    if (typeof drawer.showPopover !== "function") {
      drawer.classList.add("is-fallback-closed");
    }

    const visibleThreshold = Math.min(
      0.05,
      Math.max(0.002, 1 / Math.max(window.innerWidth, 320))
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (!entry) return;

        if (entry.intersectionRatio >= 0.05) {
          hasEnteredRef.current = true;
        }

        if (entry.intersectionRatio >= 0.98) {
          hasEnteredRef.current = true;
          setMainInert(true);
          setMenuOpen(true);
          sheet.focus({ preventScroll: true });
        } else if (
          hasEnteredRef.current &&
          entry.intersectionRatio < visibleThreshold
        ) {
          finalizeClosed();
        }
      },
      {
        root: drawer,
        threshold: [0, visibleThreshold, 0.05, 0.98, 1],
      }
    );

    observer.observe(sheet);

    let removeScrollFallback: (() => void) | undefined;
    if (
      typeof CSS !== "undefined" &&
      !CSS.supports("animation-timeline: scroll()")
    ) {
      const onScroll = () => {
        const width = sheet.offsetWidth || 1;
        const ratio = Math.max(0, Math.min(1, 1 - scroller.scrollLeft / width));
        drawer.style.setProperty("--drawer-backdrop", String(ratio));
      };
      scroller.addEventListener("scroll", onScroll, { passive: true });
      removeScrollFallback = () =>
        scroller.removeEventListener("scroll", onScroll);
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && hasEnteredRef.current) {
        closeDrawer();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      observer.disconnect();
      removeScrollFallback?.();
      document.removeEventListener("keydown", onKeyDown);
      setMainInert(false);
    };
  }, [closeDrawer, finalizeClosed, setMainInert]);

  const handleLanguageSelect = (nextLocale: Locale) => {
    setLocale(nextLocale);
    closeDrawer();
  };

  const languageSectionLabel =
    locale === "pt" ? "Idioma" : locale === "fr" ? "Langue" : "Language";

  const openMenuAriaLabel =
    locale === "pt"
      ? "Abrir menu de navegação"
      : locale === "fr"
        ? "Ouvrir le menu de navigation"
        : "Open navigation menu";

  const closeMenuAriaLabel =
    locale === "pt"
      ? "Fechar menu de navegação"
      : locale === "fr"
        ? "Fermer le menu de navigation"
        : "Close navigation menu";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md py-4 border-b border-[#EFECE6] shadow-[0_1px_10px_rgba(0,0,0,0.02)]"
            : "bg-transparent py-6 sm:py-7 lg:py-9"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Left: Minimalist Editorial Menu Trigger (opens drawer from left to right) */}
          <div className="justify-self-start">
            <button
              id={triggerId}
              type="button"
              onClick={() => void openDrawer()}
              aria-label={openMenuAriaLabel}
              aria-expanded={menuOpen}
              aria-controls={drawerId}
              className="group inline-flex items-center gap-2.5 py-2 pr-3 text-[#181716] hover:text-[#9E8765] transition-colors focus:outline-hidden cursor-pointer"
            >
              <span
                aria-hidden="true"
                className="flex flex-col space-y-1.5 w-6 items-start"
              >
                <span className="w-6 h-[1px] bg-[#181716] group-hover:bg-[#9E8765] transition-all" />
                <span className="w-4 h-[1px] bg-[#181716] group-hover:bg-[#9E8765] transition-all group-hover:w-6" />
                <span className="w-5 h-[1px] bg-[#181716] group-hover:bg-[#9E8765] transition-all group-hover:w-6" />
              </span>
              <span className="hidden sm:inline-block text-[10px] tracking-[0.25em] uppercase font-sans font-medium text-[#181716] group-hover:text-[#9E8765]">
                Menu
              </span>
            </button>
          </div>

          {/* Center: Iconic Minimalist Wordmark — True Grid Column (Never Overlaps) */}
          <div className="justify-self-center text-center">
            <Link
              href="#home"
              className="inline-block group transition-opacity hover:opacity-85"
            >
              <span className="block font-serif text-base min-[390px]:text-lg sm:text-2xl md:text-[1.75rem] tracking-[0.2em] sm:tracking-[0.28em] uppercase font-light text-[#181716] whitespace-nowrap">
                Kennedy Wanderson
              </span>
              <span className="block text-[8px] sm:text-[9px] font-sans tracking-[0.4em] sm:tracking-[0.45em] uppercase text-[#7A756E] mt-1">
                Photographer
              </span>
            </Link>
          </div>

          {/* Right: Symmetric Spacer to Keep Wordmark Perfectly Centered */}
          <div aria-hidden="true" className="justify-self-end" />
        </div>
      </header>

      {/* Left-to-Right Slide-In Editorial Navigation Drawer */}
      <div
        ref={drawerRef}
        id={drawerId}
        className="kw-drawer"
        onClick={(event) => {
          if (
            sheetRef.current &&
            !sheetRef.current.contains(event.target as Node)
          ) {
            closeDrawer();
          }
        }}
        {...({ popover: "manual" } as React.HTMLAttributes<HTMLDivElement>)}
      >
        <div ref={scrollerRef} className="kw-drawer-scroller">
          <nav
            ref={sheetRef}
            tabIndex={-1}
            aria-label="Menu"
            className="kw-drawer-sheet p-7 sm:p-10 focus:outline-hidden"
          >
            {/* Drawer Header: Close Button on the Same Left Side */}
            <div className="flex items-center justify-between pb-6 border-b border-[#EAE6DE]">
              <button
                type="button"
                onClick={closeDrawer}
                aria-label={closeMenuAriaLabel}
                className="group -ml-2 p-2 rounded-full hover:bg-black/5 transition-colors focus:outline-hidden cursor-pointer"
              >
                <X
                  aria-hidden="true"
                  size={22}
                  className="text-[#181716] group-hover:text-[#9E8765] transition-colors"
                />
              </button>

              <span className="text-[9px] tracking-[0.3em] uppercase text-[#8C8780]">
                France · Worldwide
              </span>
            </div>

            {/* Middle Content: Editorial Links + Language Selector */}
            <div className="flex flex-col justify-between py-8 gap-10">
              <ul className="flex flex-col space-y-5 sm:space-y-6">
                <li>
                  <Link
                    href="#home"
                    onClick={closeDrawer}
                    className="inline-block font-serif italic text-3xl sm:text-4xl text-[#181716] hover:text-[#9E8765] transition-all duration-300 hover:translate-x-1.5"
                  >
                    {t.nav.home}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#portfolio"
                    onClick={closeDrawer}
                    className="inline-block font-serif italic text-3xl sm:text-4xl text-[#181716] hover:text-[#9E8765] transition-all duration-300 hover:translate-x-1.5"
                  >
                    {t.nav.portfolio}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#about"
                    onClick={closeDrawer}
                    className="inline-block font-serif italic text-3xl sm:text-4xl text-[#181716] hover:text-[#9E8765] transition-all duration-300 hover:translate-x-1.5"
                  >
                    {t.nav.about}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#contact"
                    onClick={closeDrawer}
                    className="inline-block font-serif italic text-3xl sm:text-4xl text-[#181716] hover:text-[#9E8765] transition-all duration-300 hover:translate-x-1.5"
                  >
                    {t.nav.contact}
                  </Link>
                </li>
              </ul>

              {/* Language Switcher Inside Lateral Drawer */}
              <div className="pt-6 border-t border-[#EAE6DE]">
                <p className="text-[9px] tracking-[0.3em] uppercase text-[#8C8780] mb-3.5">
                  {languageSectionLabel}
                </p>
                <div
                  role="group"
                  aria-label={languageSectionLabel}
                  className="grid grid-cols-3 gap-2"
                >
                  {LANGUAGES.map((lang) => {
                    const isActive = locale === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleLanguageSelect(lang.code)}
                        aria-pressed={isActive}
                        className={`min-h-12 px-2 py-2.5 border text-center transition-all cursor-pointer ${
                          isActive
                            ? "border-[#181716] bg-[#181716] text-white"
                            : "border-[#DFDAD2] bg-white/80 text-[#6B6660] hover:border-[#9E8765] hover:text-[#181716]"
                        }`}
                      >
                        <span className="block text-[10px] tracking-[0.22em] uppercase font-medium">
                          {lang.short}
                        </span>
                        <span
                          className={`block text-[10px] mt-0.5 font-light ${
                            isActive ? "text-white/80" : "text-[#8C8780]"
                          }`}
                        >
                          {lang.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-6 border-t border-[#EAE6DE] space-y-2.5 text-[#7A756E]">
              <p className="text-[9px] tracking-[0.25em] uppercase text-[#9C968F]">
                Kennedy Wanderson Fine Art
              </p>
              <div className="flex flex-col space-y-1.5 text-[10px] tracking-[0.16em] uppercase">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#181716] transition-colors w-fit"
                >
                  Instagram
                </a>
                <a
                  href={`mailto:${contactEmail}`}
                  className="hover:text-[#181716] transition-colors break-all w-fit"
                >
                  {contactEmail}
                </a>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
