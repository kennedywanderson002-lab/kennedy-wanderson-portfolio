"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { MentionsLegalesModal } from "./MentionsLegalesModal";

export function Footer() {
  const { t } = useLanguage();
  const [mentionsOpen, setMentionsOpen] = useState(false);

  return (
    <footer className="bg-white text-[#181716] py-16 sm:py-20 border-t border-[#EFECE6]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col items-center justify-center text-center">
        
        {/* Brand Logo in Footer */}
        <Link href="#home" className="inline-block group mb-6">
          <span className="block font-serif text-lg sm:text-xl tracking-[0.25em] uppercase font-light text-[#181716]">
            Kennedy Wanderson
          </span>
          <span className="block text-[8px] font-sans tracking-[0.4em] uppercase text-[#8C8780] mt-1">
            Fine Art Photography · France
          </span>
        </Link>

        {/* Social Link (Instagram) */}
        <div className="mb-8">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-[0.25em] text-[#8C8780] hover:text-[#181716] transition-colors"
          >
            Follow on Instagram
          </a>
        </div>

        {/* Legal & Copyright Line (Jose Villa Minimalist Footer) */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-[10px] uppercase tracking-[0.2em] text-[#9C968F] font-sans">
          <span>© 2026 Kennedy Wanderson</span>
          <span className="hidden sm:inline-block">·</span>
          <span>{t.footer.rights}</span>
          <span className="hidden sm:inline-block">·</span>
          <button
            onClick={() => setMentionsOpen(true)}
            className="hover:text-[#181716] transition-colors underline underline-offset-4"
          >
            {t.footer.mentionsLegales}
          </button>
        </div>

      </div>

      {/* French LCEN Legal Modal */}
      <MentionsLegalesModal
        isOpen={mentionsOpen}
        onClose={() => setMentionsOpen(false)}
      />
    </footer>
  );
}
