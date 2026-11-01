"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Locale } from "@/data/translations";
import { X } from "lucide-react";

interface NavbarProps {
  contactEmail?: string;
  instagramUrl?: string;
}

export function Navbar({
  contactEmail = "contact@kennedywanderson.com",
  instagramUrl = "https://instagram.com",
}: NavbarProps) {
  const { locale, setLocale, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

  const languages: { code: Locale; label: string }[] = [
    { code: "fr", label: "FR" },
    { code: "en", label: "EN" },
    { code: "pt", label: "PT" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md py-4 border-b border-[#EFECE6] shadow-[0_1px_10px_rgba(0,0,0,0.02)]"
            : "bg-transparent py-7 lg:py-9"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-between">
          {/* Left: Minimalist Language Selector */}
          <div className="flex items-center space-x-2 text-[10px] tracking-[0.2em] font-sans uppercase">
            {languages.map((lang, index) => (
              <React.Fragment key={lang.code}>
                <button
                  onClick={() => setLocale(lang.code)}
                  className={`transition-colors py-1 ${
                    locale === lang.code
                      ? "text-[#181716] font-semibold underline underline-offset-4 decoration-1"
                      : "text-[#8C8780] hover:text-[#181716]"
                  }`}
                  aria-label={`Changer en ${lang.label}`}
                >
                  {lang.label}
                </button>
                {index < languages.length - 1 && (
                  <span className="text-[#D0CAC2] select-none">/</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Center: Iconic Jose Villa Style Minimalist Wordmark */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <Link
              href="#home"
              className="inline-block group transition-opacity hover:opacity-85"
            >
              <span className="block font-serif text-xl sm:text-2xl md:text-[1.75rem] tracking-[0.28em] uppercase font-light text-[#181716]">
                Kennedy Wanderson
              </span>
              <span className="block text-[8px] sm:text-[9px] font-sans tracking-[0.45em] uppercase text-[#7A756E] mt-1">
                Photographer
              </span>
            </Link>
          </div>

          {/* Right: Jose Villa Style Minimalist Hamburger Button */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open Navigation Menu"
            className="group flex items-center space-x-2.5 py-2 text-[#181716] hover:text-[#9E8765] transition-colors focus:outline-hidden"
          >
            <span className="hidden sm:inline-block text-[10px] tracking-[0.25em] uppercase font-sans font-medium text-[#181716] group-hover:text-[#9E8765]">
              Menu
            </span>
            <div className="flex flex-col space-y-1.5 w-6 items-end">
              <span className="w-6 h-[1px] bg-[#181716] group-hover:bg-[#9E8765] transition-all" />
              <span className="w-4 h-[1px] bg-[#181716] group-hover:bg-[#9E8765] transition-all group-hover:w-6" />
              <span className="w-5 h-[1px] bg-[#181716] group-hover:bg-[#9E8765] transition-all group-hover:w-6" />
            </div>
          </button>
        </div>
      </header>

      {/* Full-Screen Minimalist Editorial Overlay (Jose Villa Aesthetic) */}
      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col justify-between p-8 sm:p-14 lg:p-20 animate-in fade-in duration-300"
        >
          {/* Top Bar of Overlay */}
          <div className="flex items-center justify-between max-w-6xl mx-auto w-full">
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#8C8780]">
              France · Worldwide
            </div>

            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close Navigation Menu"
              className="group p-2.5 rounded-full hover:bg-black/5 transition-colors focus:outline-hidden"
            >
              <X
                size={26}
                className="text-[#181716] group-hover:scale-110 transition-transform"
              />
            </button>
          </div>

          {/* Centered Large Poetic Italic Links */}
          <nav className="flex flex-col items-center justify-center space-y-7 sm:space-y-9 my-auto">
            <Link
              href="#home"
              onClick={() => setMenuOpen(false)}
              className="font-serif italic text-3xl sm:text-5xl md:text-6xl text-[#181716] hover:text-[#9E8765] transition-all duration-300 hover:translate-x-2"
            >
              {t.nav.home}
            </Link>
            <Link
              href="#portfolio"
              onClick={() => setMenuOpen(false)}
              className="font-serif italic text-3xl sm:text-5xl md:text-6xl text-[#181716] hover:text-[#9E8765] transition-all duration-300 hover:translate-x-2"
            >
              {t.nav.portfolio}
            </Link>
            <Link
              href="#about"
              onClick={() => setMenuOpen(false)}
              className="font-serif italic text-3xl sm:text-5xl md:text-6xl text-[#181716] hover:text-[#9E8765] transition-all duration-300 hover:translate-x-2"
            >
              {t.nav.about}
            </Link>
            <Link
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="font-serif italic text-3xl sm:text-5xl md:text-6xl text-[#181716] hover:text-[#9E8765] transition-all duration-300 hover:translate-x-2"
            >
              {t.nav.contact}
            </Link>
          </nav>

          {/* Bottom Footer of Overlay */}
          <div className="flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto w-full pt-8 border-t border-[#EAE6DE] text-xs text-[#7A756E] gap-4">
            <p className="text-[10px] tracking-[0.25em] uppercase">
              Kennedy Wanderson Fine Art
            </p>

            <div className="flex items-center space-x-6 text-[10px] tracking-[0.2em] uppercase">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#181716] transition-colors"
              >
                Instagram
              </a>
              <span>·</span>
              <a
                href={`mailto:${contactEmail}`}
                className="hover:text-[#181716] transition-colors"
              >
                {contactEmail}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
