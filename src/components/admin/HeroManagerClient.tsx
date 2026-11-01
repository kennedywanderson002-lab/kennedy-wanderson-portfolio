"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Loader2,
  Check,
} from "lucide-react";
import type { HeroSlideData } from "@/data/hero";
import type { Locale } from "@/data/translations";
import {
  saveHeroSlideAction,
  reorderHeroSlidesAction,
  toggleHeroSlideVisibilityAction,
  deleteHeroSlideAction,
} from "@/lib/cms/actions";
import { SortableList, DragHandleButton } from "./SortableList";
import { ImageUploaderWithFocalPoint } from "./ImageUploaderWithFocalPoint";
import { LocaleTabs } from "./LocaleTabs";

interface HeroManagerClientProps {
  initialSlides: HeroSlideData[];
}

interface SlideFormState {
  id?: string;
  imageUrl: string;
  blobPathname: string | null;
  titleFr: string;
  titlePt: string;
  titleEn: string;
  tag: string;
  aspectRatio: "portrait" | "landscape";
  focalPoint: string;
  isVisible: boolean;
}

const EMPTY_FORM: SlideFormState = {
  imageUrl: "",
  blobPathname: null,
  titleFr: "",
  titlePt: "",
  titleEn: "",
  tag: "Fine Art Portrait",
  aspectRatio: "portrait",
  focalPoint: "50% 0%",
  isVisible: true,
};

export function HeroManagerClient({ initialSlides }: HeroManagerClientProps) {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlideData[]>(initialSlides);
  const [isPending, startTransition] = useTransition();
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const [editingForm, setEditingForm] = useState<SlideFormState | null>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>("pt");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showTempStatus = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const handleReorder = (newSlides: HeroSlideData[]) => {
    setSlides(newSlides);
    setErrorNotice(null);
    startTransition(async () => {
      try {
        await reorderHeroSlidesAction(newSlides.map((s) => s.id));
        showTempStatus("Ordem dos slides salva e publicada no site!");
        router.refresh();
      } catch (err) {
        setErrorNotice(
          err instanceof Error ? err.message : "Erro ao reordenar slides."
        );
      }
    });
  };

  const handleToggleVisibility = (slide: HeroSlideData) => {
    const nextVal = !slide.isVisible;
    setSlides((prev) =>
      prev.map((s) => (s.id === slide.id ? { ...s, isVisible: nextVal } : s))
    );
    setErrorNotice(null);
    startTransition(async () => {
      try {
        await toggleHeroSlideVisibilityAction(slide.id, nextVal);
        showTempStatus(
          nextVal ? "Slide ativado na capa." : "Slide ocultado da capa."
        );
        router.refresh();
      } catch (err) {
        setErrorNotice(
          err instanceof Error ? err.message : "Erro ao alterar visibilidade."
        );
      }
    });
  };

  const handleDelete = (id: string) => {
    setErrorNotice(null);
    startTransition(async () => {
      try {
        await deleteHeroSlideAction(id);
        setSlides((prev) => prev.filter((s) => s.id !== id));
        setConfirmDeleteId(null);
        showTempStatus("Slide removido com sucesso.");
        router.refresh();
      } catch (err) {
        setErrorNotice(
          err instanceof Error ? err.message : "Erro ao remover slide."
        );
      }
    });
  };

  const openCreateModal = () => {
    setActiveLocale("pt");
    setEditingForm({ ...EMPTY_FORM });
  };

  const openEditModal = (slide: HeroSlideData) => {
    setActiveLocale("pt");
    setEditingForm({
      id: slide.id,
      imageUrl: slide.image,
      blobPathname: slide.blobPathname ?? null,
      titleFr: slide.title.fr,
      titlePt: slide.title.pt,
      titleEn: slide.title.en,
      tag: slide.tag,
      aspectRatio: slide.aspectRatio,
      focalPoint: slide.focalPoint || "50% 0%",
      isVisible: slide.isVisible,
    });
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForm) return;
    setErrorNotice(null);

    const primaryTitle =
      editingForm.titleFr.trim() ||
      editingForm.titlePt.trim() ||
      editingForm.titleEn.trim();

    if (!editingForm.imageUrl.trim()) {
      setErrorNotice("Envie ou selecione uma fotografia para o slide.");
      return;
    }
    if (!primaryTitle) {
      setErrorNotice("Preencha o título da legenda em pelo menos um idioma.");
      return;
    }

    startTransition(async () => {
      try {
        await saveHeroSlideAction({
          id: editingForm.id,
          imageUrl: editingForm.imageUrl,
          blobPathname: editingForm.blobPathname,
          titleFr: editingForm.titleFr.trim() || primaryTitle,
          titlePt: editingForm.titlePt.trim() || primaryTitle,
          titleEn: editingForm.titleEn.trim() || primaryTitle,
          tag: editingForm.tag.trim() || "Fine Art",
          aspectRatio: editingForm.aspectRatio,
          focalPoint: editingForm.focalPoint,
          isVisible: editingForm.isVisible,
        });

        setEditingForm(null);
        showTempStatus("Slide salvo e publicado instantaneamente!");
        router.refresh();
        // Optimistically sync local state until server refresh completes
        setSlides((prev) => {
          const updatedItem: HeroSlideData = {
            id: editingForm.id || `temp-${Date.now()}`,
            image: editingForm.imageUrl,
            blobPathname: editingForm.blobPathname,
            title: {
              fr: editingForm.titleFr.trim() || primaryTitle,
              pt: editingForm.titlePt.trim() || primaryTitle,
              en: editingForm.titleEn.trim() || primaryTitle,
            },
            tag: editingForm.tag.trim() || "Fine Art",
            aspectRatio: editingForm.aspectRatio,
            focalPoint: editingForm.focalPoint,
            sortOrder: prev.length,
            isVisible: editingForm.isVisible,
          };
          if (editingForm.id) {
            return prev.map((s) => (s.id === editingForm.id ? updatedItem : s));
          }
          return [...prev, updatedItem];
        });
      } catch (err) {
        setErrorNotice(
          err instanceof Error ? err.message : "Erro ao salvar slide."
        );
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E1DA]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#9E8765] mb-2">
            Abertura em Tela Cheia
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#181716]">
            Slides da Capa (Hero)
          </h1>
          <p className="text-xs text-[#6B6660] font-light mt-1">
            Arraste pelo ícone lateral para definir a sequência exata em que as
            fotos aparecem na entrada do site.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#181716] text-white hover:bg-[#9E8765] px-6 py-3.5 text-[10px] uppercase tracking-[0.25em] transition-colors cursor-pointer"
        >
          <Plus size={15} />
          <span>Adicionar Novo Slide</span>
        </button>
      </div>

      {/* Feedback Banners */}
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

      {/* Drag-and-Drop Slides List */}
      <SortableList
        items={slides}
        onReorder={handleReorder}
        layout="vertical"
        renderItem={(slide, index, { dragHandleProps }) => (
          <div
            className={`bg-white border border-[#E5E1DA] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-opacity ${
              slide.isVisible ? "" : "opacity-60 bg-[#FAF9F6]"
            }`}
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <DragHandleButton
                dragHandleProps={dragHandleProps}
                label={`Mover slide ${index + 1}`}
              />

              <span className="font-mono text-xs text-[#9C968F] w-6 shrink-0">
                0{index + 1}
              </span>

              <div className="relative w-20 h-24 sm:w-24 sm:h-28 shrink-0 bg-[#141312] overflow-hidden border border-[#E5E1DA]">
                <Image
                  src={slide.image}
                  alt={slide.title.pt || slide.title.fr}
                  fill
                  sizes="110px"
                  style={{ objectPosition: slide.focalPoint || "50% 0%" }}
                  className="object-cover"
                  quality={75}
                />
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] uppercase tracking-[0.25em] px-2 py-0.5 bg-[#FAF9F6] border border-[#E5E1DA] text-[#6B6660]">
                    {slide.tag}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#9C968F]">
                    Foco: {slide.focalPoint}
                  </span>
                  {!slide.isVisible && (
                    <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200">
                      Oculto
                    </span>
                  )}
                </div>

                <p className="font-serif italic text-lg sm:text-xl text-[#181716] truncate">
                  {slide.title.pt || slide.title.fr}
                </p>
                <p className="text-[11px] text-[#8C8780] truncate">
                  FR: {slide.title.fr} · EN: {slide.title.en}
                </p>
              </div>
            </div>

            {/* Slide Row Actions */}
            <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#F2EFE9]">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleToggleVisibility(slide)}
                title={slide.isVisible ? "Ocultar da capa" : "Exibir na capa"}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E5E1DA] text-[10px] uppercase tracking-[0.18em] text-[#6B6660] hover:text-[#181716] hover:border-[#181716] transition-colors cursor-pointer"
              >
                {slide.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                <span className="hidden md:inline">
                  {slide.isVisible ? "Visível" : "Oculto"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => openEditModal(slide)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#E5E1DA] text-[10px] uppercase tracking-[0.18em] text-[#181716] hover:border-[#9E8765] hover:text-[#9E8765] transition-colors cursor-pointer"
              >
                <Pencil size={13} />
                <span>Editar</span>
              </button>

              {confirmDeleteId === slide.id ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(slide.id)}
                    className="px-3 py-2 bg-red-700 text-white text-[10px] uppercase tracking-[0.18em] cursor-pointer"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="p-2 text-[#6B6660] hover:text-[#181716] cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(slide.id)}
                  aria-label="Excluir slide"
                  className="p-2 border border-[#E5E1DA] text-[#8C8780] hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      />

      {/* Slide Create / Edit Modal */}
      {editingForm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          <div className="bg-white border border-[#E5E1DA] w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 sm:p-9 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#9E8765]">
                  {editingForm.id ? "Editar Slide" : "Novo Slide da Capa"}
                </p>
                <h2 className="font-serif text-2xl font-light text-[#181716]">
                  Fotografia &amp; Legenda de Abertura
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingForm(null)}
                className="p-2 text-[#6B6660] hover:text-[#181716] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-6">
              <ImageUploaderWithFocalPoint
                label="Fotografia Principal do Slide"
                imageUrl={editingForm.imageUrl}
                focalPoint={editingForm.focalPoint}
                previewAspectClass={
                  editingForm.aspectRatio === "landscape"
                    ? "aspect-[3/2]"
                    : "aspect-[4/5]"
                }
                helperText="No computador a foto inteira é preservada com fundo atmosférico; no celular ela preenche 100% da tela vertical seguindo o Ponto Focal marcado abaixo."
                onImageChange={(url, pathname) =>
                  setEditingForm({
                    ...editingForm,
                    imageUrl: url,
                    blobPathname: pathname ?? null,
                  })
                }
                onFocalPointChange={(fp) =>
                  setEditingForm({ ...editingForm, focalPoint: fp })
                }
              />

              {/* Tag & Orientation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-[#EFECE6]">
                <div>
                  <label
                    htmlFor="hero-tag"
                    className="block text-[10px] uppercase tracking-[0.22em] text-[#6B6660] mb-1.5"
                  >
                    Etiqueta Superior (Tag)
                  </label>
                  <input
                    id="hero-tag"
                    type="text"
                    required
                    value={editingForm.tag}
                    onChange={(e) =>
                      setEditingForm({ ...editingForm, tag: e.target.value })
                    }
                    placeholder="ex: Fine Art Portrait, Wedding Celebration"
                    className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label
                    htmlFor="hero-orientation"
                    className="block text-[10px] uppercase tracking-[0.22em] text-[#6B6660] mb-1.5"
                  >
                    Orientação Original da Foto
                  </label>
                  <select
                    id="hero-orientation"
                    value={editingForm.aspectRatio}
                    onChange={(e) =>
                      setEditingForm({
                        ...editingForm,
                        aspectRatio:
                          e.target.value === "landscape"
                            ? "landscape"
                            : "portrait",
                      })
                    }
                    className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                  >
                    <option value="portrait">Vertical (Retrato)</option>
                    <option value="landscape">Horizontal (Paisagem)</option>
                  </select>
                </div>
              </div>

              {/* Trilingual Caption */}
              <div className="space-y-3 pt-2 border-t border-[#EFECE6]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#6B6660]">
                    Título Poético do Slide (FR / PT / EN)
                  </span>
                  <LocaleTabs
                    activeLocale={activeLocale}
                    onChange={setActiveLocale}
                    completion={{
                      fr: Boolean(editingForm.titleFr.trim()),
                      pt: Boolean(editingForm.titlePt.trim()),
                      en: Boolean(editingForm.titleEn.trim()),
                    }}
                  />
                </div>

                {activeLocale === "fr" && (
                  <input
                    type="text"
                    value={editingForm.titleFr}
                    onChange={(e) =>
                      setEditingForm({
                        ...editingForm,
                        titleFr: e.target.value,
                      })
                    }
                    placeholder="ex: Falaises d'Étretat · Normandie, France"
                    className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-4 py-3 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                  />
                )}
                {activeLocale === "pt" && (
                  <input
                    type="text"
                    value={editingForm.titlePt}
                    onChange={(e) =>
                      setEditingForm({
                        ...editingForm,
                        titlePt: e.target.value,
                      })
                    }
                    placeholder="ex: Falésias de Étretat · Normandia, França"
                    className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-4 py-3 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                  />
                )}
                {activeLocale === "en" && (
                  <input
                    type="text"
                    value={editingForm.titleEn}
                    onChange={(e) =>
                      setEditingForm({
                        ...editingForm,
                        titleEn: e.target.value,
                      })
                    }
                    placeholder="ex: Étretat Sea Cliffs · Normandy, France"
                    className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-4 py-3 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                  />
                )}
                <p className="text-[11px] text-[#8C8780]">
                  Dica: se você preencher apenas um idioma agora, os outros dois
                  usarão esse mesmo título automaticamente até você traduzi-los.
                </p>
              </div>

              {/* Visibility Switch & Submit */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#EFECE6]">
                <label className="inline-flex items-center gap-2.5 text-xs text-[#4A453E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingForm.isVisible}
                    onChange={(e) =>
                      setEditingForm({
                        ...editingForm,
                        isVisible: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#181716]"
                  />
                  <span>Exibir imediatamente no carrossel da capa</span>
                </label>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingForm(null)}
                    className="px-5 py-3 border border-[#D8D3CB] text-[10px] uppercase tracking-[0.22em] text-[#6B6660] hover:text-[#181716] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center gap-2 bg-[#181716] text-white hover:bg-[#9E8765] px-6 py-3 text-[10px] uppercase tracking-[0.25em] transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isPending && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    <span>Salvar Slide</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

