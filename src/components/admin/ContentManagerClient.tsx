"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save } from "lucide-react";
import type { CmsSiteSettings } from "@/lib/cms/types";
import type { Locale, Translations } from "@/data/translations";
import { saveSiteContentAction } from "@/lib/cms/actions";
import { LocaleTabs } from "./LocaleTabs";
import { ImageUploaderWithFocalPoint } from "./ImageUploaderWithFocalPoint";

interface ContentManagerClientProps {
  initialSettings: CmsSiteSettings;
}

type ContentSectionTab = "about" | "portfolio" | "contact" | "legal";

export function ContentManagerClient({
  initialSettings,
}: ContentManagerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeSection, setActiveSection] =
    useState<ContentSectionTab>("about");
  const [activeLocale, setActiveLocale] = useState<Locale>("pt");

  const [translationsState, setTranslationsState] = useState<
    Record<Locale, Translations>
  >(initialSettings.translations);
  const [showAboutPortrait, setShowAboutPortrait] = useState<boolean>(
    initialSettings.showAboutPortrait
  );
  const [aboutPortraitUrl, setAboutPortraitUrl] = useState<string>(
    initialSettings.aboutPortraitUrl || ""
  );
  const [aboutPortraitBlobPathname, setAboutPortraitBlobPathname] = useState<
    string | null
  >(initialSettings.aboutPortraitBlobPathname);
  const [aboutPortraitFocalPoint, setAboutPortraitFocalPoint] =
    useState<string>(initialSettings.aboutPortraitFocalPoint || "50% 20%");

  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const cur = translationsState[activeLocale];

  const updateLocaleField = <K extends keyof Translations>(
    group: K,
    patch: Partial<Translations[K]>
  ) => {
    setTranslationsState((prev) => ({
      ...prev,
      [activeLocale]: {
        ...prev[activeLocale],
        [group]: {
          ...prev[activeLocale][group],
          ...patch,
        },
      },
    }));
  };

  const updateContactFormField = (
    patch: Partial<Translations["contact"]["form"]>
  ) => {
    setTranslationsState((prev) => ({
      ...prev,
      [activeLocale]: {
        ...prev[activeLocale],
        contact: {
          ...prev[activeLocale].contact,
          form: {
            ...prev[activeLocale].contact.form,
            ...patch,
          },
        },
      },
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    if (showAboutPortrait && !aboutPortraitUrl.trim()) {
      setErrorNotice(
        "Você ativou a foto na seção Sobre, mas ainda não enviou uma imagem. Envie uma foto ou desative a chave."
      );
      return;
    }

    startTransition(async () => {
      try {
        await saveSiteContentAction({
          translationsJson: translationsState,
          showAboutPortrait,
          aboutPortraitUrl: aboutPortraitUrl.trim() || null,
          aboutPortraitBlobPathname,
          aboutPortraitFocalPoint,
          contactEmail: initialSettings.contactEmail,
          whatsappNumber: initialSettings.whatsappNumber,
          whatsappDefaultMessage: initialSettings.whatsappDefaultMessage,
          instagramUrl: initialSettings.instagramUrl,
        });

        setStatusNotice(
          "Textos e preferências visuais salvos e publicados no site!"
        );
        setTimeout(() => setStatusNotice(null), 4000);
        router.refresh();
      } catch (err) {
        setErrorNotice(
          err instanceof Error ? err.message : "Erro ao salvar textos."
        );
      }
    });
  };

  const sectionTabs: { id: ContentSectionTab; label: string }[] = [
    { id: "about", label: "Seção Sobre & Retrato" },
    { id: "portfolio", label: "Títulos da Galeria" },
    { id: "contact", label: "Formulário & Destinos" },
    { id: "legal", label: "Rodapé & Aviso Legal" },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E1DA]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#9E8765] mb-2">
            Edição Trilíngue Instantânea
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#181716]">
            Sobre &amp; Textos do Site
          </h1>
          <p className="text-xs text-[#6B6660] font-light mt-1">
            Altere biografia, citações, subtítulos, lista de destinos e aviso
            legal em Francês, Português e Inglês.
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#181716] text-white hover:bg-[#9E8765] px-7 py-3.5 text-[10px] uppercase tracking-[0.25em] transition-colors cursor-pointer disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          <span>Salvar Alterações</span>
        </button>
      </div>

      {/* Notices */}
      <div aria-live="polite">
        {statusNotice && (
          <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-950 flex items-center gap-2">
            <Check size={15} className="text-emerald-700" />
            <span>{statusNotice}</span>
          </div>
        )}
        {errorNotice && (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-900">
            {errorNotice}
          </div>
        )}
      </div>

      {/* Section + Language Switchers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {sectionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] border transition-colors cursor-pointer ${
                activeSection === tab.id
                  ? "bg-[#181716] text-white border-[#181716]"
                  : "bg-white text-[#6B6660] border-[#E5E1DA] hover:border-[#181716] hover:text-[#181716]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <LocaleTabs activeLocale={activeLocale} onChange={setActiveLocale} />
      </div>

      {/* 1. ABOUT SECTION */}
      {activeSection === "about" && (
        <div className="bg-white border border-[#E5E1DA] p-6 sm:p-9 space-y-8">
          {/* Optional Portrait Toggle */}
          <div className="border border-[#EFECE6] bg-[#FAF9F6] p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#9E8765] font-medium">
                  Retrato do Fotógrafo (Opcional)
                </p>
                <p className="text-xs text-[#6B6660] font-light mt-0.5">
                  Atualmente desligado para manter o layout editorial puramente
                  tipográfico. Quando desejar exibir sua foto, basta ativar a
                  chave ao lado.
                </p>
              </div>

              <label className="inline-flex items-center gap-2.5 text-xs font-medium text-[#181716] cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={showAboutPortrait}
                  onChange={(e) => setShowAboutPortrait(e.target.checked)}
                  className="w-4 h-4 accent-[#181716]"
                />
                <span>
                  {showAboutPortrait
                    ? "Retrato Ativo no Site"
                    : "Sem Foto (Tipográfico)"}
                </span>
              </label>
            </div>

            {showAboutPortrait && (
              <div className="pt-4 border-t border-[#E5E1DA]">
                <ImageUploaderWithFocalPoint
                  label="Retrato Editorial de Kennedy Wanderson"
                  imageUrl={aboutPortraitUrl}
                  focalPoint={aboutPortraitFocalPoint}
                  previewAspectClass="aspect-[4/5]"
                  helperText="Arraste o retrato ou ajuste o zoom para enquadrar perfeitamente ao lado da sua biografia editorial."
                  previewContext={{
                    mode: "about",
                    title: cur.about.title,
                    subtitle: cur.about.subtitle,
                    paragraph1: cur.about.paragraph1,
                    quote: cur.about.quote,
                    quoteAuthor: cur.about.quoteAuthor,
                  }}
                  onImageChange={(url, pathname) => {
                    setAboutPortraitUrl(url);
                    setAboutPortraitBlobPathname(pathname ?? null);
                  }}
                  onFocalPointChange={setAboutPortraitFocalPoint}
                />
              </div>
            )}
          </div>

          {/* About Text Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Etiqueta Superior ({activeLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={cur.about.tagline}
                onChange={(e) =>
                  updateLocaleField("about", { tagline: e.target.value })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Assinatura / Nome ({activeLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={cur.about.title}
                onChange={(e) =>
                  updateLocaleField("about", { title: e.target.value })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Linha de Localização ({activeLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={cur.about.locationLine}
                onChange={(e) =>
                  updateLocaleField("about", { locationLine: e.target.value })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
              Título Poético Principal ({activeLocale.toUpperCase()})
            </label>
            <input
              type="text"
              value={cur.about.subtitle}
              onChange={(e) =>
                updateLocaleField("about", { subtitle: e.target.value })
              }
              className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-3 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Citação em Destaque ({activeLocale.toUpperCase()})
              </label>
              <textarea
                rows={2}
                value={cur.about.quote}
                onChange={(e) =>
                  updateLocaleField("about", { quote: e.target.value })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] p-3.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Autor da Citação
              </label>
              <input
                type="text"
                value={cur.about.quoteAuthor}
                onChange={(e) =>
                  updateLocaleField("about", { quoteAuthor: e.target.value })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-3 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-4">
            {(["paragraph1", "paragraph2", "paragraph3"] as const).map(
              (field, idx) => (
                <div key={field}>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                    Parágrafo {idx + 1} da Biografia (
                    {activeLocale.toUpperCase()})
                  </label>
                  <textarea
                    rows={3}
                    value={cur.about[field]}
                    onChange={(e) =>
                      updateLocaleField("about", { [field]: e.target.value })
                    }
                    className="w-full border border-[#D8D3CB] bg-[#FAF9F6] p-3.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                  />
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* 2. PORTFOLIO SECTION HEADINGS */}
      {activeSection === "portfolio" && (
        <div className="bg-white border border-[#E5E1DA] p-6 sm:p-9 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Etiqueta Superior ({activeLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={cur.portfolio.tagline}
                onChange={(e) =>
                  updateLocaleField("portfolio", { tagline: e.target.value })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Título Principal da Galeria ({activeLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={cur.portfolio.title}
                onChange={(e) =>
                  updateLocaleField("portfolio", { title: e.target.value })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
              Subtítulo de Apresentação ({activeLocale.toUpperCase()})
            </label>
            <textarea
              rows={2}
              value={cur.portfolio.subtitle}
              onChange={(e) =>
                updateLocaleField("portfolio", { subtitle: e.target.value })
              }
              className="w-full border border-[#D8D3CB] bg-[#FAF9F6] p-3.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#EFECE6]">
            {(
              [
                ["all", "Filtro: Todos"],
                ["weddings", "Filtro: Casamentos"],
                ["editorials", "Filtro: Destinations"],
                ["portraits", "Filtro: Retratos"],
                ["details", "Filtro: Branding"],
                ["filmDetails", "Rodapé Técnico do Lightbox"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                  {label} ({activeLocale.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={cur.portfolio[key]}
                  onChange={(e) =>
                    updateLocaleField("portfolio", { [key]: e.target.value })
                  }
                  className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CONTACT & DESTINATIONS */}
      {activeSection === "contact" && (
        <div className="bg-white border border-[#E5E1DA] p-6 sm:p-9 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Etiqueta Superior ({activeLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={cur.contact.tagline}
                onChange={(e) =>
                  updateLocaleField("contact", { tagline: e.target.value })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Título da Seção de Contato ({activeLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={cur.contact.title}
                onChange={(e) =>
                  updateLocaleField("contact", { title: e.target.value })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
              Texto de Abertura ({activeLocale.toUpperCase()})
            </label>
            <textarea
              rows={2}
              value={cur.contact.subtitle}
              onChange={(e) =>
                updateLocaleField("contact", { subtitle: e.target.value })
              }
              className="w-full border border-[#D8D3CB] bg-[#FAF9F6] p-3.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#EFECE6]">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Opções de Destino (1 por linha · {activeLocale.toUpperCase()})
              </label>
              <textarea
                rows={7}
                value={cur.contact.form.destinations.join("\n")}
                onChange={(e) =>
                  updateContactFormField({
                    destinations: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] p-3.5 text-xs text-[#181716] font-mono leading-relaxed focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Faixas de Convidados (1 por linha · {activeLocale.toUpperCase()}
                )
              </label>
              <textarea
                rows={5}
                value={cur.contact.form.guestCountOptions.join("\n")}
                onChange={(e) =>
                  updateContactFormField({
                    guestCountOptions: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] p-3.5 text-xs text-[#181716] font-mono leading-relaxed focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[#EFECE6]">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Título de Confirmação de Envio ({activeLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={cur.contact.form.successTitle}
                onChange={(e) =>
                  updateContactFormField({ successTitle: e.target.value })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Mensagem de Agradecimento ({activeLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={cur.contact.form.successMessage}
                onChange={(e) =>
                  updateContactFormField({ successMessage: e.target.value })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. FOOTER & MENTIONS LEGALES */}
      {activeSection === "legal" && (
        <div className="bg-white border border-[#E5E1DA] p-6 sm:p-9 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Direitos Reservados no Rodapé ({activeLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={cur.footer.rights}
                onChange={(e) =>
                  updateLocaleField("footer", { rights: e.target.value })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                Botão Aviso Legal / RGPD ({activeLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={cur.footer.mentionsLegales}
                onChange={(e) =>
                  updateLocaleField("footer", {
                    mentionsLegales: e.target.value,
                  })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#EFECE6]">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                1. Editor do Site ({activeLocale.toUpperCase()})
              </label>
              <textarea
                rows={2}
                value={cur.mentions.editorContent}
                onChange={(e) =>
                  updateLocaleField("mentions", {
                    editorContent: e.target.value,
                  })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] p-3.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                3. Propriedade Intelectual ({activeLocale.toUpperCase()})
              </label>
              <textarea
                rows={3}
                value={cur.mentions.ipContent}
                onChange={(e) =>
                  updateLocaleField("mentions", { ipContent: e.target.value })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] p-3.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1.5">
                4. Privacidade &amp; RGPD ({activeLocale.toUpperCase()})
              </label>
              <textarea
                rows={3}
                value={cur.mentions.privacyContent}
                onChange={(e) =>
                  updateLocaleField("mentions", {
                    privacyContent: e.target.value,
                  })
                }
                className="w-full border border-[#D8D3CB] bg-[#FAF9F6] p-3.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

