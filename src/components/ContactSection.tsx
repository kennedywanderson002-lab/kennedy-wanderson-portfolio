"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { CheckCircle2, MessageCircle, MapPin, Mail, ShieldCheck } from "lucide-react";

export function ContactSection() {
  const { t } = useLanguage();
  const formText = t.contact.form;

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    eventDate: "",
    destination: formText.destinations[0] || "",
    guestCount: formText.guestCountOptions[1] || "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  const whatsappUrl = `https://wa.me/33612345678?text=${encodeURIComponent(
    "Bonjour Kennedy, nous découvrons votre portfolio et souhaitons échanger à propos de notre mariage."
  )}`;

  return (
    <section id="contact" className="py-28 sm:py-36 bg-white border-t border-[#EFECE6]">
      <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-14">
        
        {/* Minimalist Centered Header (Jose Villa Style) */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <p className="text-[9px] sm:text-[10px] font-sans uppercase tracking-[0.4em] font-medium text-[#8C8780] mb-3">
            {t.contact.tagline}
          </p>
          <h2 className="font-serif italic text-3xl sm:text-5xl font-light text-[#181716] mb-5">
            {t.contact.title}
          </h2>
          <p className="text-xs sm:text-sm font-light text-[#6B6660] leading-relaxed">
            {t.contact.subtitle}
          </p>
        </div>

        {/* Minimal Underline Form Area */}
        {isSuccess ? (
          <div className="p-12 text-center border-b border-[#EAE6DE] animate-in fade-in duration-500 max-w-xl mx-auto">
            <CheckCircle2 size={40} className="text-[#181716] mx-auto mb-4" />
            <h3 className="font-serif italic text-2xl sm:text-3xl font-light text-[#181716] mb-3">
              {formText.successTitle}
            </h3>
            <p className="text-xs sm:text-sm font-light text-[#6B6660] leading-relaxed mb-8">
              {formText.successMessage}
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="text-[10px] uppercase tracking-[0.25em] text-[#181716] underline underline-offset-8 hover:text-[#9E8765] transition-colors"
            >
              Envoyer une autre demande
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10 sm:space-y-12 max-w-2xl mx-auto">
            
            {/* Row 1: Names & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
              <div>
                <label className="block font-serif italic text-sm text-[#181716] mb-1">
                  {formText.fullName} <span className="text-[#8C8780]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder={formText.fullNamePlaceholder}
                  className="input-minimal-underline"
                />
              </div>

              <div>
                <label className="block font-serif italic text-sm text-[#181716] mb-1">
                  {formText.email} <span className="text-[#8C8780]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={formText.emailPlaceholder}
                  className="input-minimal-underline"
                />
              </div>
            </div>

            {/* Row 2: Phone & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
              <div>
                <label className="block font-serif italic text-sm text-[#181716] mb-1">
                  {formText.phone}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={formText.phonePlaceholder}
                  className="input-minimal-underline"
                />
              </div>

              <div>
                <label className="block font-serif italic text-sm text-[#181716] mb-1">
                  {formText.eventDate} <span className="text-[#8C8780]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  placeholder={formText.eventDatePlaceholder}
                  className="input-minimal-underline"
                />
              </div>
            </div>

            {/* Row 3: Destination & Guest Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
              <div>
                <label className="block font-serif italic text-sm text-[#181716] mb-1">
                  {formText.destination}
                </label>
                <select
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="input-minimal-underline cursor-pointer"
                >
                  {formText.destinations.map((dest, i) => (
                    <option key={i} value={dest}>
                      {dest}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-serif italic text-sm text-[#181716] mb-1">
                  {formText.guestCount}
                </label>
                <select
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  className="input-minimal-underline cursor-pointer"
                >
                  {formText.guestCountOptions.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 4: Message */}
            <div>
              <label className="block font-serif italic text-sm text-[#181716] mb-1">
                {formText.message} <span className="text-[#8C8780]">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={formText.messagePlaceholder}
                className="input-minimal-underline resize-none"
              />
            </div>

            {/* Submit Button Centered (Jose Villa Signature Button) */}
            <div className="text-center pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-block bg-[#181716] text-white hover:bg-[#9E8765] px-10 py-4 text-[10px] uppercase tracking-[0.3em] font-sans font-medium transition-colors duration-300 disabled:opacity-50"
              >
                {isSubmitting ? formText.submitting : formText.submit}
              </button>
            </div>

            {/* Privacy notice */}
            <p className="text-[10px] font-sans text-center text-[#9C968F] max-w-md mx-auto leading-relaxed pt-2">
              {formText.privacyNotice}
            </p>
          </form>
        )}

        {/* Minimal Direct Contacts Below (Airy, Centered) */}
        <div className="mt-20 pt-12 border-t border-[#EAE6DE] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A756E] gap-6">
          <div className="flex items-center space-x-2 text-[11px]">
            <MapPin size={13} className="text-[#9E8765]" />
            <span>France · Europe · Worldwide</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <a
              href="mailto:contact@kennedywanderson.com"
              className="hover:text-[#181716] transition-colors"
            >
              contact@kennedywanderson.com
            </a>
            <span>·</span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#181716] transition-colors"
            >
              WhatsApp (+33 6 12 34 56 78)
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
