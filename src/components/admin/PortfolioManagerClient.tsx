"use client";

import React, { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { uploadAdminImage } from "@/lib/cms/upload-client";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Loader2,
  Check,
  Star,
  UploadCloud,
} from "lucide-react";
import type {
  CmsPortfolioImage,
  CmsPortfolioProject,
} from "@/lib/cms/types";
import type { Locale } from "@/data/translations";
import {
  savePortfolioProjectAction,
  reorderPortfolioProjectsAction,
  togglePortfolioProjectVisibilityAction,
  deletePortfolioProjectAction,
} from "@/lib/cms/actions";
import { SortableList, DragHandleButton } from "./SortableList";
import { ImageUploaderWithFocalPoint } from "./ImageUploaderWithFocalPoint";
import { LocaleTabs } from "./LocaleTabs";
import {
  formatFramingSummary,
  getFramedImageStyle,
} from "@/lib/cms/framing";

interface PortfolioManagerClientProps {
  initialProjects: CmsPortfolioProject[];
}

type AspectClassOption =
  | "aspect-[4/5]"
  | "aspect-[3/4]"
  | "aspect-[2/3]"
  | "aspect-[3/2]";

type ColSpanOption =
  | "lg:col-span-4"
  | "lg:col-span-6"
  | "lg:col-span-8"
  | "lg:col-span-12";

interface ProjectFormState {
  id?: string;
  slug?: string;
  category: "weddings" | "editorials" | "portraits" | "details";
  title: Record<Locale, string>;
  categoryLabel: Record<Locale, string>;
  location: Record<Locale, string>;
  description: Record<Locale, string>;
  season: string;
  camera: string;
  coverImageUrl: string;
  coverBlobPathname: string | null;
  aspectClass: AspectClassOption;
  colSpan: ColSpanOption;
  focalPoint: string;
  isVisible: boolean;
  images: CmsPortfolioImage[];
}

const CATEGORY_TABS = [
  { id: "all", label: "Todos" },
  { id: "weddings", label: "Casamentos" },
  { id: "editorials", label: "Destinations & Séries" },
  { id: "portraits", label: "Retratos" },
  { id: "details", label: "Branding & Detalhes" },
] as const;

const COL_SPAN_OPTIONS: { value: ColSpanOption; label: string; hint: string }[] =
  [
    { value: "lg:col-span-4", label: "1/3 da Linha", hint: "3 por fileira" },
    { value: "lg:col-span-6", label: "Meia Linha", hint: "2 por fileira" },
    { value: "lg:col-span-8", label: "2/3 Destaque", hint: "Editorial amplo" },
    { value: "lg:col-span-12", label: "Largura Total", hint: "Panorâmico" },
  ];

const ASPECT_OPTIONS: { value: AspectClassOption; label: string }[] = [
  { value: "aspect-[4/5]", label: "4:5 Vertical Editorial" },
  { value: "aspect-[3/4]", label: "3:4 Vertical Clássico" },
  { value: "aspect-[2/3]", label: "2:3 Retrato Longo" },
  { value: "aspect-[3/2]", label: "3:2 Horizontal Paisagem" },
];

function createEmptyProjectForm(): ProjectFormState {
  return {
    category: "weddings",
    title: { fr: "", pt: "", en: "" },
    categoryLabel: {
      fr: "Mariage & Célébration",
      pt: "Casamento & Celebração",
      en: "Wedding Celebration",
    },
    location: { fr: "France", pt: "França", en: "France" },
    description: { fr: "", pt: "", en: "" },
    season: "Été",
    camera: "Sony A7 IV · 35mm f/1.4 GM",
    coverImageUrl: "",
    coverBlobPathname: null,
    aspectClass: "aspect-[4/5]",
    colSpan: "lg:col-span-6",
    focalPoint: "50% 0%",
    isVisible: true,
    images: [],
  };
}

export function PortfolioManagerClient({
  initialProjects,
}: PortfolioManagerClientProps) {
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [projects, setProjects] =
    useState<CmsPortfolioProject[]>(initialProjects);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const [editingForm, setEditingForm] = useState<ProjectFormState | null>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>("pt");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [manualGalleryUrl, setManualGalleryUrl] = useState("");

  const showTempStatus = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const filteredProjects =
    filterCategory === "all"
      ? projects
      : projects.filter((p) => p.category === filterCategory);

  const handleReorder = (reorderedSubset: CmsPortfolioProject[]) => {
    let nextAll: CmsPortfolioProject[];
    if (filterCategory === "all") {
      nextAll = reorderedSubset;
    } else {
      // Preserve relative slots of the filtered category inside the global list
      const subsetIds = new Set(reorderedSubset.map((p) => p.id));
      let cursor = 0;
      nextAll = projects.map((proj) =>
        subsetIds.has(proj.id) ? reorderedSubset[cursor++] : proj
      );
    }

    setProjects(nextAll);
    setErrorNotice(null);
    startTransition(async () => {
      try {
        await reorderPortfolioProjectsAction(nextAll.map((p) => p.id));
        showTempStatus("Ordem visual do portfólio atualizada no site!");
        router.refresh();
      } catch (err) {
        setErrorNotice(
          err instanceof Error ? err.message : "Erro ao salvar nova ordem."
        );
      }
    });
  };

  const handleToggleVisibility = (project: CmsPortfolioProject) => {
    const nextVal = !project.isVisible;
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, isVisible: nextVal } : p))
    );
    setErrorNotice(null);
    startTransition(async () => {
      try {
        await togglePortfolioProjectVisibilityAction(project.id, nextVal);
        showTempStatus(
          nextVal
            ? "Projeto publicado na galeria."
            : "Projeto ocultado da galeria pública."
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
        await deletePortfolioProjectAction(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        setConfirmDeleteId(null);
        showTempStatus("História removida do portfólio.");
        router.refresh();
      } catch (err) {
        setErrorNotice(
          err instanceof Error ? err.message : "Erro ao remover história."
        );
      }
    });
  };

  const openCreateModal = () => {
    setActiveLocale("pt");
    setErrorNotice(null);
    setEditingForm(createEmptyProjectForm());
  };

  const openEditModal = (proj: CmsPortfolioProject) => {
    setActiveLocale("pt");
    setErrorNotice(null);
    const validAspect: AspectClassOption =
      proj.aspectClass === "aspect-[3/4]" ||
      proj.aspectClass === "aspect-[2/3]" ||
      proj.aspectClass === "aspect-[3/2]"
        ? proj.aspectClass
        : "aspect-[4/5]";

    const validColSpan: ColSpanOption =
      proj.colSpan === "lg:col-span-4" ||
      proj.colSpan === "lg:col-span-8" ||
      proj.colSpan === "lg:col-span-12"
        ? proj.colSpan
        : "lg:col-span-6";

    setEditingForm({
      id: proj.id,
      slug: proj.slug,
      category: proj.category,
      title: { ...proj.title },
      categoryLabel: { ...proj.categoryLabel },
      location: { ...proj.location },
      description: { ...proj.description },
      season: proj.season,
      camera: proj.camera,
      coverImageUrl: proj.coverImage,
      coverBlobPathname: proj.coverBlobPathname ?? null,
      aspectClass: validAspect,
      colSpan: validColSpan,
      focalPoint: proj.focalPoint || "50% 0%",
      isVisible: proj.isVisible,
      images:
        proj.images.length > 0
          ? proj.images.map((img) => ({ ...img }))
          : [
              {
                id: `${proj.id}-cover`,
                imageUrl: proj.coverImage,
                blobPathname: proj.coverBlobPathname ?? null,
                altText: proj.title.fr,
                sortOrder: 0,
              },
            ],
    });
  };

  const handleMultiGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editingForm) return;
    setUploadingGallery(true);
    setErrorNotice(null);

    try {
      const uploadedItems: CmsPortfolioImage[] = [];
      for (const file of Array.from(files)) {
        const blob = await uploadAdminImage(file);

        uploadedItems.push({
          id: `temp-img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          imageUrl: blob.url,
          blobPathname: blob.pathname,
          altText: editingForm.title.fr || editingForm.title.pt || "Fine Art",
          sortOrder: editingForm.images.length + uploadedItems.length,
        });
      }

      setEditingForm((prev) => {
        if (!prev) return prev;
        const nextImages = [...prev.images, ...uploadedItems];
        const nextCover = prev.coverImageUrl || uploadedItems[0]?.imageUrl || "";
        return {
          ...prev,
          coverImageUrl: nextCover,
          images: nextImages,
        };
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao enviar fotos da galeria.";
      setErrorNotice(msg);
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) {
        galleryInputRef.current.value = "";
      }
    }
  };

  const handleAddManualGalleryUrl = () => {
    const trimmed = manualGalleryUrl.trim();
    if (!trimmed || !editingForm) return;
    const newImg: CmsPortfolioImage = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      imageUrl: trimmed,
      blobPathname: null,
      altText: editingForm.title.pt || editingForm.title.fr,
      sortOrder: editingForm.images.length,
    };
    setEditingForm({
      ...editingForm,
      coverImageUrl: editingForm.coverImageUrl || trimmed,
      images: [...editingForm.images, newImg],
    });
    setManualGalleryUrl("");
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForm) return;
    setErrorNotice(null);

    const primaryTitle =
      editingForm.title.fr.trim() ||
      editingForm.title.pt.trim() ||
      editingForm.title.en.trim();
    const primaryLocation =
      editingForm.location.fr.trim() ||
      editingForm.location.pt.trim() ||
      editingForm.location.en.trim() ||
      "France";
    const primaryCatLabel =
      editingForm.categoryLabel.fr.trim() ||
      editingForm.categoryLabel.pt.trim() ||
      editingForm.categoryLabel.en.trim() ||
      "Fine Art";
    const primaryDesc =
      editingForm.description.fr.trim() ||
      editingForm.description.pt.trim() ||
      editingForm.description.en.trim() ||
      primaryTitle;

    if (!editingForm.coverImageUrl.trim()) {
      setErrorNotice("Selecione ou envie uma foto de capa para o projeto.");
      return;
    }
    if (!primaryTitle) {
      setErrorNotice("Informe o título do projeto em pelo menos um idioma.");
      return;
    }

    // Ensure coverImageUrl is always present in the gallery list
    const galleryList =
      editingForm.images.length > 0
        ? editingForm.images
        : [
            {
              id: `cover-${Date.now()}`,
              imageUrl: editingForm.coverImageUrl,
              blobPathname: editingForm.coverBlobPathname,
              altText: primaryTitle,
              sortOrder: 0,
            },
          ];

    startTransition(async () => {
      try {
        await savePortfolioProjectAction({
          id: editingForm.id,
          slug: editingForm.slug,
          category: editingForm.category,
          titleFr: editingForm.title.fr.trim() || primaryTitle,
          titlePt: editingForm.title.pt.trim() || primaryTitle,
          titleEn: editingForm.title.en.trim() || primaryTitle,
          categoryLabelFr:
            editingForm.categoryLabel.fr.trim() || primaryCatLabel,
          categoryLabelPt:
            editingForm.categoryLabel.pt.trim() || primaryCatLabel,
          categoryLabelEn:
            editingForm.categoryLabel.en.trim() || primaryCatLabel,
          locationFr: editingForm.location.fr.trim() || primaryLocation,
          locationPt: editingForm.location.pt.trim() || primaryLocation,
          locationEn: editingForm.location.en.trim() || primaryLocation,
          descriptionFr: editingForm.description.fr.trim() || primaryDesc,
          descriptionPt: editingForm.description.pt.trim() || primaryDesc,
          descriptionEn: editingForm.description.en.trim() || primaryDesc,
          season: editingForm.season.trim() || "Été",
          camera: editingForm.camera.trim(),
          coverImageUrl: editingForm.coverImageUrl,
          coverBlobPathname: editingForm.coverBlobPathname,
          aspectRatio:
            editingForm.aspectClass === "aspect-[3/2]"
              ? "landscape"
              : "portrait",
          aspectClass: editingForm.aspectClass,
          colSpan: editingForm.colSpan,
          focalPoint: editingForm.focalPoint,
          isVisible: editingForm.isVisible,
          images: galleryList.map((img) => ({
            id: img.id.startsWith("temp-") || img.id.startsWith("manual-")
              ? undefined
              : img.id,
            imageUrl: img.imageUrl,
            blobPathname: img.blobPathname ?? null,
            altText: img.altText || primaryTitle,
          })),
        });

        setEditingForm(null);
        showTempStatus("Projeto salvo e publicado instantaneamente!");
        router.refresh();
      } catch (err) {
        setErrorNotice(
          err instanceof Error ? err.message : "Erro ao salvar projeto."
        );
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5E1DA]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#9E8765] mb-2">
            Curadoria da Galeria &amp; Lightbox
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-[#181716]">
            Portfólio &amp; Ordem Visual
          </h1>
          <p className="text-xs text-[#6B6660] font-light mt-1">
            Arraste os cards para mudar a posição na grade do site, ajuste
            tamanhos de coluna, ponto focal e as fotos internas de cada ensaio.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-[#181716] text-white hover:bg-[#9E8765] px-6 py-3.5 text-[10px] uppercase tracking-[0.25em] transition-colors cursor-pointer"
        >
          <Plus size={15} />
          <span>Nova História / Ensaio</span>
        </button>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_TABS.map((tab) => {
          const active = filterCategory === tab.id;
          const count =
            tab.id === "all"
              ? projects.length
              : projects.filter((p) => p.category === tab.id).length;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterCategory(tab.id)}
              className={`px-4 py-2 text-[10px] uppercase tracking-[0.2em] border transition-colors cursor-pointer ${
                active
                  ? "bg-[#181716] text-white border-[#181716]"
                  : "bg-white text-[#6B6660] border-[#E5E1DA] hover:border-[#181716] hover:text-[#181716]"
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Status & Error Notices */}
      <div aria-live="polite">
        {statusNotice && (
          <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-950 flex items-center gap-2">
            <Check size={15} className="text-emerald-700" />
            <span>{statusNotice}</span>
          </div>
        )}
        {errorNotice && !editingForm && (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-900">
            {errorNotice}
          </div>
        )}
      </div>

      {/* Sortable Portfolio Grid */}
      <SortableList
        items={filteredProjects}
        onReorder={handleReorder}
        layout="grid"
        gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        renderItem={(project, idx, { dragHandleProps }) => (
          <div
            className={`bg-white border border-[#E5E1DA] flex flex-col justify-between overflow-hidden transition-opacity ${
              project.isVisible ? "" : "opacity-60"
            }`}
          >
            <div>
              {/* Card Top Bar */}
              <div className="px-3.5 py-2.5 border-b border-[#F2EFE9] flex items-center justify-between bg-[#FAF9F6]">
                <div className="flex items-center gap-1.5">
                  <DragHandleButton
                    dragHandleProps={dragHandleProps}
                    label={`Arrastar ${project.title.pt || project.title.fr}`}
                  />
                  <span className="font-mono text-[11px] text-[#8C8780]">
                    #{String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] text-[#6B6660]">
                  <span className="px-2 py-0.5 bg-white border border-[#E5E1DA]">
                    {project.colSpan?.replace("lg:col-span-", "") || "6"} col
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-[#E5E1DA]">
                    {project.images.length} foto
                    {project.images.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {/* Cover Preview */}
              <div className="relative w-full aspect-[4/5] bg-[#FAF9F6] overflow-hidden">
                <Image
                  src={project.coverImage}
                  alt={project.title.pt || project.title.fr}
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  style={getFramedImageStyle(project.focalPoint)}
                  className="object-cover"
                  quality={75}
                />
                <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/65 backdrop-blur-xs text-white/90 font-mono text-[9px] tracking-wider">
                  {formatFramingSummary(project.focalPoint)}
                </span>
                {!project.isVisible && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-amber-950/85 text-amber-100 text-[9px] uppercase tracking-[0.2em]">
                    Oculto no Site
                  </span>
                )}
              </div>

              {/* Metadata */}
              <div className="p-5 space-y-1">
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#9E8765]">
                  {project.location.pt || project.location.fr}
                </p>
                <h3 className="font-serif italic text-xl text-[#181716] leading-snug">
                  {project.title.pt || project.title.fr}
                </h3>
              </div>
            </div>

            {/* Footer Controls */}
            <div className="px-5 py-3.5 border-t border-[#F2EFE9] flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleToggleVisibility(project)}
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[#6B6660] hover:text-[#181716] cursor-pointer"
              >
                {project.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                <span>{project.isVisible ? "Visível" : "Oculto"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(project)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E1DA] text-[10px] uppercase tracking-[0.18em] text-[#181716] hover:border-[#9E8765] hover:text-[#9E8765] cursor-pointer"
                >
                  <Pencil size={12} />
                  <span>Editar</span>
                </button>

                {confirmDeleteId === project.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(project.id)}
                      className="px-2.5 py-1.5 bg-red-700 text-white text-[10px] uppercase tracking-[0.15em] cursor-pointer"
                    >
                      Excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="p-1 text-[#6B6660] cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(project.id)}
                    aria-label="Excluir história"
                    className="p-1.5 border border-[#E5E1DA] text-[#8C8780] hover:text-red-700 hover:border-red-200 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      />

      {/* Full Editorial Project Modal */}
      {editingForm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div className="bg-white border border-[#E5E1DA] w-full max-w-5xl max-h-[94vh] overflow-y-auto p-6 sm:p-10 shadow-2xl space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#9E8765]">
                  {editingForm.id
                    ? "Editar História do Portfólio"
                    : "Nova História do Portfólio"}
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-light text-[#181716]">
                  Enquadramento, Textos &amp; Galeria Lightbox
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingForm(null)}
                className="p-2 text-[#6B6660] hover:text-[#181716] cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            {errorNotice && (
              <div className="border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-900">
                {errorNotice}
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-8">
              {/* 1. Cover Photo & Focal Point */}
              <ImageUploaderWithFocalPoint
                label="1. Fotografia de Capa & Estúdio de Enquadramento"
                imageUrl={editingForm.coverImageUrl}
                focalPoint={editingForm.focalPoint}
                previewAspectClass={editingForm.aspectClass}
                helperText="Arraste a foto diretamente no quadro ou use o Zoom e os controles abaixo enquanto vê o card real do portfólio à direita."
                previewContext={{
                  mode: "portfolio",
                  title:
                    editingForm.title[activeLocale] ||
                    editingForm.title.pt ||
                    editingForm.title.fr ||
                    "Título da História",
                  location:
                    editingForm.location[activeLocale] ||
                    editingForm.location.pt ||
                    editingForm.location.fr ||
                    "Paris · France",
                  camera: editingForm.camera,
                  aspectClass: editingForm.aspectClass,
                  colSpan: editingForm.colSpan,
                  onAspectClassChange: (nextAspect) =>
                    setEditingForm({ ...editingForm, aspectClass: nextAspect }),
                  onColSpanChange: (nextColSpan) =>
                    setEditingForm({ ...editingForm, colSpan: nextColSpan }),
                }}
                onImageChange={(url, pathname) =>
                  setEditingForm((prev) => {
                    if (!prev) return prev;
                    const existsInGallery = prev.images.some(
                      (i) => i.imageUrl === url
                    );
                    return {
                      ...prev,
                      coverImageUrl: url,
                      coverBlobPathname: pathname ?? null,
                      images: existsInGallery
                        ? prev.images
                        : [
                            {
                              id: `temp-cover-${Date.now()}`,
                              imageUrl: url,
                              blobPathname: pathname ?? null,
                              altText: prev.title.pt || prev.title.fr,
                              sortOrder: 0,
                            },
                            ...prev.images,
                          ],
                    };
                  })
                }
                onFocalPointChange={(fp) =>
                  setEditingForm({ ...editingForm, focalPoint: fp })
                }
              />

              {/* 2. Grid Size & Aspect Ratio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#EFECE6]">
                <div>
                  <span className="block text-[10px] uppercase tracking-[0.22em] text-[#6B6660] mb-2">
                    Largura do Card na Grade (Desktop 12 Colunas)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {COL_SPAN_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setEditingForm({ ...editingForm, colSpan: opt.value })
                        }
                        className={`p-3 border text-left transition-colors cursor-pointer ${
                          editingForm.colSpan === opt.value
                            ? "border-[#181716] bg-[#181716] text-white"
                            : "border-[#E5E1DA] bg-[#FAF9F6] text-[#4A453E] hover:border-[#9E8765]"
                        }`}
                      >
                        <span className="block text-[10px] uppercase tracking-[0.18em] font-medium">
                          {opt.label}
                        </span>
                        <span
                          className={`block text-[11px] mt-0.5 ${
                            editingForm.colSpan === opt.value
                              ? "text-white/75"
                              : "text-[#8C8780]"
                          }`}
                        >
                          {opt.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="proj-aspect"
                    className="block text-[10px] uppercase tracking-[0.22em] text-[#6B6660] mb-2"
                  >
                    Proporção da Moldura na Grade
                  </label>
                  <select
                    id="proj-aspect"
                    value={editingForm.aspectClass}
                    onChange={(e) =>
                      setEditingForm({
                        ...editingForm,
                        aspectClass: e.target.value as AspectClassOption,
                      })
                    }
                    className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-3 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden mb-4"
                  >
                    {ASPECT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <label
                    htmlFor="proj-category"
                    className="block text-[10px] uppercase tracking-[0.22em] text-[#6B6660] mb-2"
                  >
                    Categoria de Filtro
                  </label>
                  <select
                    id="proj-category"
                    value={editingForm.category}
                    onChange={(e) =>
                      setEditingForm({
                        ...editingForm,
                        category: e.target
                          .value as ProjectFormState["category"],
                      })
                    }
                    className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-3 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                  >
                    <option value="weddings">Casamentos &amp; Celebrações</option>
                    <option value="editorials">Destinations &amp; Séries</option>
                    <option value="portraits">Retratos Autorais</option>
                    <option value="details">Branding &amp; Detalhes</option>
                  </select>
                </div>
              </div>

              {/* 3. Trilingual Texts */}
              <div className="space-y-4 pt-4 border-t border-[#EFECE6]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#6B6660] font-medium">
                    2. Títulos, Localização &amp; Narrativa Editorial
                  </span>
                  <LocaleTabs
                    activeLocale={activeLocale}
                    onChange={setActiveLocale}
                    completion={{
                      fr: Boolean(editingForm.title.fr.trim()),
                      pt: Boolean(editingForm.title.pt.trim()),
                      en: Boolean(editingForm.title.en.trim()),
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                      Título da História ({activeLocale.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      value={editingForm.title[activeLocale]}
                      onChange={(e) =>
                        setEditingForm({
                          ...editingForm,
                          title: {
                            ...editingForm.title,
                            [activeLocale]: e.target.value,
                          },
                        })
                      }
                      placeholder="ex: Romance nas Falésias de Étretat"
                      className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                      Localização ({activeLocale.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      value={editingForm.location[activeLocale]}
                      onChange={(e) =>
                        setEditingForm({
                          ...editingForm,
                          location: {
                            ...editingForm.location,
                            [activeLocale]: e.target.value,
                          },
                        })
                      }
                      placeholder="ex: Étretat · Normandia, França"
                      className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                      Subtítulo no Lightbox ({activeLocale.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      value={editingForm.categoryLabel[activeLocale]}
                      onChange={(e) =>
                        setEditingForm({
                          ...editingForm,
                          categoryLabel: {
                            ...editingForm.categoryLabel,
                            [activeLocale]: e.target.value,
                          },
                        })
                      }
                      placeholder="ex: Ensaio de Casal"
                      className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                      Estação / Época
                    </label>
                    <input
                      type="text"
                      value={editingForm.season}
                      onChange={(e) =>
                        setEditingForm({
                          ...editingForm,
                          season: e.target.value,
                        })
                      }
                      placeholder="ex: Été 2026"
                      className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                      Câmera / Lente (Opcional)
                    </label>
                    <input
                      type="text"
                      value={editingForm.camera}
                      onChange={(e) =>
                        setEditingForm({
                          ...editingForm,
                          camera: e.target.value,
                        })
                      }
                      placeholder="Sony A7 IV · 35mm f/1.4"
                      className="w-full border border-[#D8D3CB] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] mb-1">
                    Descrição / Texto do Lightbox ({activeLocale.toUpperCase()})
                  </label>
                  <textarea
                    rows={3}
                    value={editingForm.description[activeLocale]}
                    onChange={(e) =>
                      setEditingForm({
                        ...editingForm,
                        description: {
                          ...editingForm.description,
                          [activeLocale]: e.target.value,
                        },
                      })
                    }
                    placeholder="Conte brevemente a atmosfera e a luz dessa sessão..."
                    className="w-full border border-[#D8D3CB] bg-[#FAF9F6] p-3.5 text-sm text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 4. Lightbox Multi-Photo Gallery & Drag-and-Drop Order */}
              <div className="space-y-4 pt-4 border-t border-[#EFECE6]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="block text-[10px] uppercase tracking-[0.25em] text-[#6B6660] font-medium">
                      3. Fotos Internas da Galeria ({editingForm.images.length})
                    </span>
                    <span className="text-xs text-[#8C8780] font-light">
                      Arraste as miniaturas para ordenar a sequência do Lightbox
                      ou clique na estrela para torná-la capa.
                    </span>
                  </div>

                  <div>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={(e) =>
                        void handleMultiGalleryUpload(e.target.files)
                      }
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingGallery}
                      onClick={() => galleryInputRef.current?.click()}
                      className="inline-flex items-center gap-2 bg-[#FAF9F6] border border-[#181716] text-[#181716] hover:bg-[#181716] hover:text-white px-4 py-2.5 text-[10px] uppercase tracking-[0.22em] transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {uploadingGallery ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Enviando Fotos...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={14} />
                          <span>Adicionar Múltiplas Fotos</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Optional Manual URL Add */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualGalleryUrl}
                    onChange={(e) => setManualGalleryUrl(e.target.value)}
                    placeholder="Ou cole o caminho/URL de uma foto (/images/real/...) e clique em Incluir"
                    className="flex-1 border border-[#D8D3CB] bg-[#FAF9F6] px-3 py-2 text-xs text-[#181716] focus:border-[#181716] focus:bg-white focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualGalleryUrl}
                    className="px-4 py-2 border border-[#D8D3CB] text-[10px] uppercase tracking-[0.2em] text-[#181716] hover:border-[#181716] cursor-pointer"
                  >
                    Incluir
                  </button>
                </div>

                {editingForm.images.length > 0 && (
                  <SortableList
                    items={editingForm.images}
                    onReorder={(nextImgs) =>
                      setEditingForm({ ...editingForm, images: nextImgs })
                    }
                    layout="grid"
                    gridClassName="grid grid-cols-2 sm:grid-cols-4 gap-3"
                    renderItem={(img, imgIdx, { dragHandleProps }) => {
                      const isCover =
                        editingForm.coverImageUrl === img.imageUrl;
                      return (
                        <div
                          className={`border p-2 bg-[#FAF9F6] space-y-2 ${
                            isCover ? "border-[#9E8765]" : "border-[#E5E1DA]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <DragHandleButton
                              dragHandleProps={dragHandleProps}
                              label={`Mover foto ${imgIdx + 1}`}
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingForm({
                                    ...editingForm,
                                    coverImageUrl: img.imageUrl,
                                    coverBlobPathname: img.blobPathname ?? null,
                                  })
                                }
                                title="Definir como foto de capa"
                                className={`p-1 cursor-pointer ${
                                  isCover
                                    ? "text-[#9E8765]"
                                    : "text-[#9C968F] hover:text-[#181716]"
                                }`}
                              >
                                <Star
                                  size={14}
                                  fill={isCover ? "currentColor" : "none"}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingForm({
                                    ...editingForm,
                                    images: editingForm.images.filter(
                                      (item) => item.id !== img.id
                                    ),
                                  })
                                }
                                title="Remover foto da galeria"
                                className="p-1 text-[#9C968F] hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="relative w-full aspect-square bg-white overflow-hidden">
                            <Image
                              src={img.imageUrl}
                              alt={img.altText || `Foto ${imgIdx + 1}`}
                              fill
                              sizes="160px"
                              className="object-cover"
                              quality={75}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.15em] text-[#8C8780] px-0.5">
                            <span>#{imgIdx + 1}</span>
                            {isCover && (
                              <span className="text-[#9E8765] font-medium">
                                Capa Atual
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />
                )}
              </div>

              {/* Footer Save Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-[#EFECE6]">
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
                  <span>Publicar este projeto visível no portfólio</span>
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
                    className="inline-flex items-center gap-2 bg-[#181716] text-white hover:bg-[#9E8765] px-7 py-3.5 text-[10px] uppercase tracking-[0.25em] transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isPending && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    <span>Salvar &amp; Publicar Projeto</span>
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

