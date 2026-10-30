"use client";

import React, { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { X, Shield, Server, FileText, Lock } from "lucide-react";

interface MentionsLegalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MentionsLegalesModal({ isOpen, onClose }: MentionsLegalesModalProps) {
  const { t } = useLanguage();
  const m = t.mentions;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mentions-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 max-w-2xl w-full max-h-[85vh] bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#F4EFEB]">
          <div>
            <h3 id="mentions-title" className="font-serif text-xl sm:text-2xl text-[#1C1A18]">
              {m.title}
            </h3>
            <p className="text-[10px] text-[#736D65] uppercase tracking-wider mt-0.5">
              Conformité Juridique Française & Européenne
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={m.close}
            className="p-2 rounded-full hover:bg-black/5 transition-colors text-[#1C1A18]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-[#59534B] leading-relaxed">
          <p className="italic text-[#736D65] pb-2 border-b border-[#E8E2D9]">
            {m.subtitle}
          </p>

          <div>
            <div className="flex items-center space-x-2 text-[#1C1A18] font-medium text-sm mb-1.5">
              <FileText size={15} className="text-[#9E8765]" />
              <h4>{m.editorTitle}</h4>
            </div>
            <p>{m.editorContent}</p>
          </div>

          <div>
            <div className="flex items-center space-x-2 text-[#1C1A18] font-medium text-sm mb-1.5">
              <Server size={15} className="text-[#9E8765]" />
              <h4>{m.hostingTitle}</h4>
            </div>
            <p>{m.hostingContent}</p>
          </div>

          <div>
            <div className="flex items-center space-x-2 text-[#1C1A18] font-medium text-sm mb-1.5">
              <Shield size={15} className="text-[#9E8765]" />
              <h4>{m.ipTitle}</h4>
            </div>
            <p>{m.ipContent}</p>
          </div>

          <div>
            <div className="flex items-center space-x-2 text-[#1C1A18] font-medium text-sm mb-1.5">
              <Lock size={15} className="text-[#9E8765]" />
              <h4>{m.privacyTitle}</h4>
            </div>
            <p>{m.privacyContent}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E2D9] bg-[#F4EFEB] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#1C1A18] text-[#FAF8F5] text-xs uppercase tracking-wider font-medium hover:bg-[#9E8765] transition-colors"
          >
            {m.close}
          </button>
        </div>
      </div>
    </div>
  );
}
