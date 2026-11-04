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

let cachedSupportsDisplayTransition: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (cachedSupportsDisplayTransition !== undefined) {
    return cachedSupportsDisplayTransition;
  }
  if (
    typeof window === "undefined" ||
    !window.CSS?.supports?.("transition-behavior", "allow-discrete") ||
    !document.body
  ) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText =
    "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  void getComputedStyle(probe).display;
  probe.style.display = "none";
  cachedSupportsDisplayTransition = getComputedStyle(probe).display === "block";
  probe.remove();
  return cachedSupportsDisplayTransition;
}

function supportsTopLayerExit(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.CSS?.supports?.("overlay", "auto")) &&
    canTransitionDisplay()
  );
}

export function Navbar({
  contactEmail = "contact@kennedywanderson.com",
  instagramUrl = "https://instagram.com",
}: NavbarProps) {
  const { locale, setLocale, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const rawId = useId();
  const drawerId = `kw-nav-dialog-${rawId.replace(/:/g, "")}`;
  const triggerId = `kw-nav-trigger-${rawId.replace(/:/g, "")}`;

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const isClosingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openDrawer = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    isClosingRef.current = false;
    dialog.removeAttribute("data-closing");

    if (!dialog.open) {
      dialog.showModal();
    }
    setMenuOpen(true);
  }, []);

  const closeDrawer = useCallback(async () => {
    const dialog = dialogRef.current;
    if (!dialog || !dialog.open) {
      isClosingRef.current = false;
      setMenuOpen(false);
      return;
    }

    if (isClosingRef.current) return;
    isClosingRef.current = true;

    try {
      if (!supportsTopLayerExit()) {
        dialog.setAttribute("data-closing", "");
        const animations = dialog.getAnimations({ subtree: true });
        if (animations.length > 0) {
          await Promise.race([
            Promise.allSettled(animations.map((a) => a.finished)),
            new Promise<void>((resolve) => setTimeout(resolve, 260)),
          ]);
        }
        dialog.removeAttribute("data-closing");
      }
    } finally {
      dialog.removeAttribute("data-closing");
      if (dialog.open) {
        dialog.close();
      }
      isClosingRef.current = false;
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      void closeDrawer();
    };

    const handleClose = () => {
      dialog.returnValue = "";
      dialog.removeAttribute("data-closing");
      isClosingRef.current = false;
      setMenuOpen(false);
    };

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);

    // Light-dismiss fallback for browsers where <dialog closedby="any"> is unsupported (e.g. Safari iOS)
    let cleanupOutsidePointer: (() => void) | undefined;
    if (
      typeof HTMLDialogElement !== "undefined" &&
      !("closedBy" in HTMLDialogElement.prototype)
    ) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const rect = dialog.getBoundingClientRect();
        return (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        );
      };

      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = dialog.open && isOutside(e);
      };

      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && dialog.open && isOutside(e)) {
          pressedOutside = false;
          void closeDrawer();
        } else {
          pressedOutside = false;
        }
      };

      dialog.addEventListener("pointerdown", onPointerDown);
      dialog.addEventListener("pointerup", onPointerUp);
      cleanupOutsidePointer = () => {
        dialog.removeEventListener("pointerdown", onPointerDown);
        dialog.removeEventListener("pointerup", onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
      cleanupOutsidePointer?.();
    };
  }, [closeDrawer]);

  const handleLanguageSelect = (nextLocale: Locale) => {
    setLocale(nextLocale);
    void closeDrawer();
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
              onClick={openDrawer}
              aria-label={openMenuAriaLabel}
              aria-expanded={menuOpen}
              aria-controls={drawerId}
              className="group inline-flex items-center gap-2.5 min-h-11 min-w-11 py-2 pr-3 text-[#181716] hover:text-[#9E8765] transition-colors focus:outline-hidden cursor-pointer touch-manipulation"
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
              <span className="block font-serif text-[13px] min-[375px]:text-[15px] min-[420px]:text-lg sm:text-2xl md:text-[1.75rem] tracking-[0.16em] min-[390px]:tracking-[0.2em] sm:tracking-[0.28em] uppercase font-light text-[#181716] whitespace-nowrap">
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

      {/* Native Top-Layer Modal <dialog> Sliding Left -> Right */}
      <dialog
        ref={dialogRef}
        id={drawerId}
        aria-label="Menu"
        className="kw-nav-dialog"
        onTouchStart={(e) => {
          const t0 = e.touches[0];
          if (t0) {
            touchStartRef.current = { x: t0.clientX, y: t0.clientY };
          }
        }}
        onTouchEnd={(e) => {
          const start = touchStartRef.current;
          touchStartRef.current = null;
          const t1 = e.changedTouches[0];
          if (!start || !t1) return;
          const dx = t1.clientX - start.x;
          const dy = t1.clientY - start.y;
          if (dx < -55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            void closeDrawer();
          }
        }}
        {...({
          closedby: "any",
        } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      >
        <nav
          aria-label="Menu"
          className="grid grid-rows-[auto_1fr_auto] h-full w-full overflow-y-auto p-7 sm:p-10"
        >
          {/* Drawer Header: Close Button on the Same Left Side */}
          <div className="flex items-center justify-between pb-6 border-b border-[#EAE6DE]">
            <button
              type="button"
              autoFocus
              onClick={() => void closeDrawer()}
              aria-label={closeMenuAriaLabel}
              className="group -ml-2.5 min-w-11 min-h-11 inline-flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors focus:outline-hidden cursor-pointer touch-manipulation"
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
                  onClick={() => void closeDrawer()}
                  className="inline-block py-1 font-serif italic text-3xl sm:text-4xl text-[#181716] hover:text-[#9E8765] transition-all duration-300 hover:translate-x-1.5 touch-manipulation"
                >
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link
                  href="#portfolio"
                  onClick={() => void closeDrawer()}
                  className="inline-block py-1 font-serif italic text-3xl sm:text-4xl text-[#181716] hover:text-[#9E8765] transition-all duration-300 hover:translate-x-1.5 touch-manipulation"
                >
                  {t.nav.portfolio}
                </Link>
              </li>
              <li>
                <Link
                  href="#about"
                  onClick={() => void closeDrawer()}
                  className="inline-block py-1 font-serif italic text-3xl sm:text-4xl text-[#181716] hover:text-[#9E8765] transition-all duration-300 hover:translate-x-1.5 touch-manipulation"
                >
                  {t.nav.about}
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  onClick={() => void closeDrawer()}
                  className="inline-block py-1 font-serif italic text-3xl sm:text-4xl text-[#181716] hover:text-[#9E8765] transition-all duration-300 hover:translate-x-1.5 touch-manipulation"
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
                      className={`min-h-12 px-2 py-2.5 border text-center transition-all cursor-pointer touch-manipulation select-none ${
                        isActive
                          ? "border-[#181716] bg-[#181716] text-white"
                          : "border-[#DFDAD2] bg-white text-[#6B6660] hover:border-[#9E8765] hover:text-[#181716] active:bg-[#EFECE6]"
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
                className="hover:text-[#181716] transition-colors w-fit py-0.5 touch-manipulation"
              >
                Instagram
              </a>
              <a
                href={`mailto:${contactEmail}`}
                className="hover:text-[#181716] transition-colors break-all w-fit py-0.5 touch-manipulation"
              >
                {contactEmail}
              </a>
            </div>
          </div>
        </nav>
      </dialog>
    </>
  );
}
