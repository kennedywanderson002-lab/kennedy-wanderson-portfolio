"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { CheckCircle2, MapPin } from "lucide-react";
import { submitContactInquiryAction } from "@/lib/cms/actions";
import { trackSiteEvent } from "./AnalyticsTracker";

interface ContactSectionProps {
  contactEmail?: string;
  whatsappNumber?: string;
  whatsappDefaultMessage?: string;
}

export function ContactSection({
  contactEmail = "contact@kennedywanderson.com",
  whatsappNumber = "33612345678",
  whatsappDefaultMessage = "Bonjour Kennedy, nous découvrons votre portfolio et souhaitons échanger à propos de notre mariage.",
}: ContactSectionProps) {
  const { locale, t } = useLanguage();
  const formText = t.contact.form;

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    eventDate: "",
    destination: "",
    guestCount: "",
    message: "",
    websiteHoneypot: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedDestination =
    formData.destination || formText.destinations[0] || "";
  const selectedGuestCount =
    formData.guestCount || formText.guestCountOptions[1] || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitContactInquiryAction({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        eventDate: formData.eventDate,
        destination: selectedDestination,
        guestCount: selectedGuestCount,
        message: formData.message,
        locale,
        websiteHoneypot: formData.websiteHoneypot,
      });

      setIsSuccess(true);
      trackSiteEvent({ eventType: "inquiry_submit", locale });
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        eventDate: "",
        destination: "",
        guestCount: "",
        message: "",
        websiteHoneypot: "",
      });
    } catch {
      setSubmitError(
        locale === "pt"
          ? "Não foi possível enviar no momento. Por favor, tente novamente ou chame no WhatsApp."
          : locale === "fr"
          ? "Une erreur est survenue. Veuillez réessayer ou nous écrire sur WhatsApp."
          : "Something went wrong. Please try again or reach out via WhatsApp."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanWaDigits = whatsappNumber.replace(/[^\d]/g, "") || "33612345678";
  const whatsappUrl = `https://wa.me/${cleanWaDigits}?text=${encodeURIComponent(
    whatsappDefaultMessage
  )}`;

  return (
    <section
      id="contact"
      className="py-28 sm:py-36 bg-white border-t border-[#EFECE6]"
    >
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
              className="text-[10px] uppercase tracking-[0.25em] text-[#181716] underline underline-offset-8 hover:text-[#9E8765] transition-colors cursor-pointer"
            >
              {locale === "pt"
                ? "Enviar outra mensagem"
                : locale === "en"
                ? "Send another inquiry"
                : "Envoyer une autre demande"}
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-10 sm:space-y-12 max-w-2xl mx-auto"
          >
            {/* Anti-spam Honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={formData.websiteHoneypot}
              onChange={(e) =>
                setFormData({ ...formData, websiteHoneypot: e.target.value })
              }
              className="sr-only"
            />

            {submitError && (
              <div
                role="alert"
                className="border border-red-200 bg-red-50/70 px-4 py-3 text-xs text-red-900 text-center"
              >
                {submitError}
              </div>
            )}

            {/* Row 1: Names & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
              <div>
                <label
                  htmlFor="contact-fullname"
                  className="block font-serif italic text-sm text-[#181716] mb-1"
                >
                  {formText.fullName} <span className="text-[#8C8780]">*</span>
                </label>
                <input
                  id="contact-fullname"
                  type="text"
                  required
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder={formText.fullNamePlaceholder}
                  className="input-minimal-underline"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="block font-serif italic text-sm text-[#181716] mb-1"
                >
                  {formText.email} <span className="text-[#8C8780]">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="none"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder={formText.emailPlaceholder}
                  className="input-minimal-underline"
                />
              </div>
            </div>

            {/* Row 2: Phone & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
              <div>
                <label
                  htmlFor="contact-phone"
                  className="block font-serif italic text-sm text-[#181716] mb-1"
                >
                  {formText.phone}
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder={formText.phonePlaceholder}
                  className="input-minimal-underline"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-date"
                  className="block font-serif italic text-sm text-[#181716] mb-1"
                >
                  {formText.eventDate}{" "}
                  <span className="text-[#8C8780]">*</span>
                </label>
                <input
                  id="contact-date"
                  type="text"
                  required
                  value={formData.eventDate}
                  onChange={(e) =>
                    setFormData({ ...formData, eventDate: e.target.value })
                  }
                  placeholder={formText.eventDatePlaceholder}
                  className="input-minimal-underline"
                />
              </div>
            </div>

            {/* Row 3: Destination & Guest Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
              <div>
                <label
                  htmlFor="contact-destination"
                  className="block font-serif italic text-sm text-[#181716] mb-1"
                >
                  {formText.destination}
                </label>
                <select
                  id="contact-destination"
                  value={selectedDestination}
                  onChange={(e) =>
                    setFormData({ ...formData, destination: e.target.value })
                  }
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
                <label
                  htmlFor="contact-guests"
                  className="block font-serif italic text-sm text-[#181716] mb-1"
                >
                  {formText.guestCount}
                </label>
                <select
                  id="contact-guests"
                  value={selectedGuestCount}
                  onChange={(e) =>
                    setFormData({ ...formData, guestCount: e.target.value })
                  }
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
              <label
                htmlFor="contact-message"
                className="block font-serif italic text-sm text-[#181716] mb-1"
              >
                {formText.message} <span className="text-[#8C8780]">*</span>
              </label>
              <textarea
                id="contact-message"
                rows={4}
                required
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder={formText.messagePlaceholder}
                className="input-minimal-underline resize-none"
              />
            </div>

            {/* Submit Button Centered (Jose Villa Signature Button) */}
            <div className="text-center pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-block bg-[#181716] text-white hover:bg-[#9E8765] px-10 py-4 text-[10px] uppercase tracking-[0.3em] font-sans font-medium transition-colors duration-300 disabled:opacity-50 cursor-pointer"
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
              href={`mailto:${contactEmail}`}
              className="hover:text-[#181716] transition-colors"
            >
              {contactEmail}
            </a>
            <span>·</span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackSiteEvent({ eventType: "whatsapp_click", locale })
              }
              className="hover:text-[#181716] transition-colors"
            >
              WhatsApp (+{cleanWaDigits})
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
