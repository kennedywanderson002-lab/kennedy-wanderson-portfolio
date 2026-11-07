"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Crosshair,
  Loader2,
  Link2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Smartphone,
  Monitor,
  LayoutGrid,
  Move,
  Sparkles,
  Copy,
} from "lucide-react";
import { uploadAdminImage } from "@/lib/cms/upload-client";
import {
  clampFramingCoord,
  clampFramingZoom,
  getViewportFramedImageStyle,
  parseImageFraming,
  serializeImageFraming,
  type DesktopHeroFitMode,
  type FramingViewport,
  type ImageFramingConfig,
  type ViewportFraming,
} from "@/lib/cms/framing";

export type PortfolioAspectOption =
  | "aspect-[4/5]"
  | "aspect-[3/4]"
  | "aspect-[2/3]"
  | "aspect-[3/2]";

export type PortfolioColSpanOption =
  | "lg:col-span-4"
  | "lg:col-span-6"
  | "lg:col-span-8"
  | "lg:col-span-12";

export type FramingPreviewContext =
  | {
      mode: "hero";
      tag?: string;
      captionTitle?: string;
      slideNumberLabel?: string;
    }
  | {
      mode: "portfolio";
      title?: string;
      location?: string;
      camera?: string;
      aspectClass?: PortfolioAspectOption;
      colSpan?: PortfolioColSpanOption;
      onAspectClassChange?: (nextAspect: PortfolioAspectOption) => void;
      onColSpanChange?: (nextColSpan: PortfolioColSpanOption) => void;
    }
  | {
      mode: "about";
      title?: string;
      subtitle?: string;
      paragraph1?: string;
      quote?: string;
      quoteAuthor?: string;
    };

interface ImageUploaderWithFocalPointProps {
  label: string;
  imageUrl: string;
  focalPoint: string;
  onImageChange: (url: string, blobPathname?: string | null) => void;
  onFocalPointChange: (focalPoint: string) => void;
  previewAspectClass?: string;
  helperText?: string;
  previewContext?: FramingPreviewContext;
}

const QUICK_PRESETS: { label: string; x: number; y: number }[] = [
  { label: "Topo / Rostos", x: 50, y: 10 },
  { label: "Terço Sup.", x: 50, y: 25 },
  { label: "Centro", x: 50, y: 50 },
  { label: "Terço Inf.", x: 50, y: 75 },
  { label: "Base", x: 50, y: 90 },
];

const PORTFOLIO_ASPECT_PILLS: {
  value: PortfolioAspectOption;
  short: string;
  label: string;
}[] = [
  { value: "aspect-[4/5]", short: "4:5", label: "Vertical Editorial" },
  { value: "aspect-[3/4]", short: "3:4", label: "Clássico" },
  { value: "aspect-[2/3]", short: "2:3", label: "Retrato Longo" },
  { value: "aspect-[3/2]", short: "3:2", label: "Horizontal" },
];

export function ImageUploaderWithFocalPoint({
  label,
  imageUrl,
  focalPoint,
  onImageChange,
  onFocalPointChange,
  previewAspectClass = "aspect-[4/5]",
  helperText,
  previewContext,
}: ImageUploaderWithFocalPointProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [showGridOverlay, setShowGridOverlay] = useState(true);
  const [isDraggingStage, setIsDraggingStage] = useState(false);

  // Independent target device being edited ("mobile" vs "desktop")
  const [editingDevice, setEditingDevice] =
    useState<FramingViewport>("mobile");

  const [heroPreviewTab, setHeroPreviewTab] = useState<
    "mobile" | "desktop" | "split"
  >("split");
  const [portfolioPreviewTab, setPortfolioPreviewTab] = useState<
    "card" | "grid"
  >("card");

  const dragSessionRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const framing = parseImageFraming(focalPoint);

  // Active viewport values based on whether the user is editing Mobile or Desktop
  const activeViewport: ViewportFraming =
    editingDevice === "desktop"
      ? framing.desktop
      : { x: framing.x, y: framing.y, zoom: framing.zoom };

  // Updates ONLY the currently selected device ("mobile" or "desktop") without touching the other
  const emitActiveViewportFraming = (patch: Partial<ViewportFraming>) => {
    if (editingDevice === "desktop") {
      const next: ImageFramingConfig = {
        ...framing,
        desktop: {
          ...framing.desktop,
          ...patch,
        },
      };
      onFocalPointChange(serializeImageFraming(next));
    } else {
      const next: ImageFramingConfig = {
        ...framing,
        x: patch.x ?? framing.x,
        y: patch.y ?? framing.y,
        zoom: patch.zoom ?? framing.zoom,
        desktop: { ...framing.desktop },
      };
      onFocalPointChange(serializeImageFraming(next));
    }
  };

  const setDesktopHeroFit = (mode: DesktopHeroFitMode) => {
    const next: ImageFramingConfig = {
      ...framing,
      desktopFit: mode,
    };
    onFocalPointChange(serializeImageFraming(next));
  };

  const copyFromOtherDevice = () => {
    if (editingDevice === "desktop") {
      const next: ImageFramingConfig = {
        ...framing,
        desktop: { x: framing.x, y: framing.y, zoom: framing.zoom },
      };
      onFocalPointChange(serializeImageFraming(next));
    } else {
      const next: ImageFramingConfig = {
        ...framing,
        x: framing.desktop.x,
        y: framing.desktop.y,
        zoom: framing.desktop.zoom,
      };
      onFocalPointChange(serializeImageFraming(next));
    }
  };

  const handleFileSelect = async (file: File | null | undefined) => {
    if (!file) return;
    setUploadError(null);

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.type)) {
      setUploadError(
        "Formato inválido. Envie apenas JPG, PNG, WebP ou AVIF."
      );
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError("A imagem excede o limite máximo de 25 MB.");
      return;
    }

    setIsUploading(true);
    try {
      const blob = await uploadAdminImage(file);
      onImageChange(blob.url, blob.pathname);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Falha ao enviar imagem para o Vercel Blob.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Pointer-capture drag + click-to-center on the interactive framing stage
  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !stageRef.current) return;
    stageRef.current.setPointerCapture(e.pointerId);
    dragSessionRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: activeViewport.x,
      startY: activeViewport.y,
      moved: false,
    };
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    const stage = stageRef.current;
    if (!session || !stage || !stage.hasPointerCapture(e.pointerId)) return;

    const dx = e.clientX - session.startClientX;
    const dy = e.clientY - session.startClientY;

    if (!session.moved && Math.hypot(dx, dy) < 4) {
      return;
    }

    session.moved = true;
    if (!isDraggingStage) {
      setIsDraggingStage(true);
    }

    const rect = stage.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);

    // Natural drag-to-pan: dragging image right/down reveals left/top of photograph
    const sensitivity = 100 / Math.max(1, activeViewport.zoom * 0.85);
    const nextX = clampFramingCoord(
      session.startX - (dx / width) * sensitivity,
      activeViewport.x
    );
    const nextY = clampFramingCoord(
      session.startY - (dy / height) * sensitivity,
      activeViewport.y
    );

    emitActiveViewportFraming({ x: nextX, y: nextY });
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    const stage = stageRef.current;
    if (!session || !stage) return;

    if (!session.moved) {
      // Single click/tap: set focal point directly to clicked coordinate
      const rect = stage.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      const relY = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
      emitActiveViewportFraming({
        x: clampFramingCoord(relX, activeViewport.x),
        y: clampFramingCoord(relY, activeViewport.y),
      });
    }

    dragSessionRef.current = null;
    setIsDraggingStage(false);
  };

  const handleStageLostPointerCapture = () => {
    dragSessionRef.current = null;
    setIsDraggingStage(false);
  };

  const handleStageKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      emitActiveViewportFraming({
        x: clampFramingCoord(activeViewport.x - step, activeViewport.x),
      });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      emitActiveViewportFraming({
        x: clampFramingCoord(activeViewport.x + step, activeViewport.x),
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      emitActiveViewportFraming({
        y: clampFramingCoord(activeViewport.y - step, activeViewport.y),
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      emitActiveViewportFraming({
        y: clampFramingCoord(activeViewport.y + step, activeViewport.y),
      });
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      emitActiveViewportFraming({
        zoom: clampFramingZoom(activeViewport.zoom + 0.1, activeViewport.zoom),
      });
    } else if (e.key === "-") {
      e.preventDefault();
      emitActiveViewportFraming({
        zoom: clampFramingZoom(activeViewport.zoom - 0.1, activeViewport.zoom),
      });
    }
  };

  const effectiveAspectClass =
    previewContext?.mode === "portfolio" && previewContext.aspectClass
      ? previewContext.aspectClass
      : previewAspectClass;

  const mobileFramedStyle = getViewportFramedImageStyle(framing, "mobile");
  const desktopFramedStyle = getViewportFramedImageStyle(framing, "desktop");
  const activeStageStyle =
    editingDevice === "desktop" ? desktopFramedStyle : mobileFramedStyle;

  const desktopHeroUsesCover = framing.desktopFit === "cover";

  // Match the interactive drag stage aspect ratio to the device being edited
  const stageAspectClass =
    previewContext?.mode === "hero"
      ? editingDevice === "mobile"
        ? "aspect-[9/16] max-w-[235px]"
        : "aspect-[16/10] w-full"
      : effectiveAspectClass;

  const stageUsesContain =
    previewContext?.mode === "hero" &&
    editingDevice === "desktop" &&
    !desktopHeroUsesCover;

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="block text-[10px] uppercase tracking-[0.25em] text-[#6B6660] font-medium">
          {label}
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowManualUrl((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[#8C8780] hover:text-[#181716] transition-colors cursor-pointer"
          >
            <Link2 size={12} />
            <span>{showManualUrl ? "Ocultar URL" : "Usar caminho / URL"}</span>
          </button>
        </div>
      </div>

      {helperText && (
        <p className="text-xs text-[#7A756E] font-light leading-relaxed">
          {helperText}
        </p>
      )}

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const dropped = e.dataTransfer.files?.[0];
          void handleFileSelect(dropped);
        }}
        className="border border-dashed border-[#C9C2B8] bg-[#FAF9F6] hover:border-[#9E8765] transition-colors p-4 sm:p-5 text-center"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => void handleFileSelect(e.target.files?.[0])}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 bg-[#181716] text-white hover:bg-[#9E8765] px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Enviando Foto HD...</span>
              </>
            ) : (
              <>
                <UploadCloud size={14} />
                <span>
                  {imageUrl ? "Trocar Fotografia" : "Enviar Fotografia HD"}
                </span>
              </>
            )}
          </button>
          <span className="text-[11px] text-[#8C8780]">
            ou arraste o arquivo aqui · JPG, PNG, WebP até 25 MB
          </span>
        </div>
      </div>

      {showManualUrl && (
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-[#8C8780] mb-1">
            Caminho local ou URL externa da imagem
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => onImageChange(e.target.value, null)}
            placeholder="/images/real/49390.jpg.jpeg ou https://..."
            className="w-full border border-[#D8D3CB] bg-white px-3.5 py-2.5 text-xs text-[#181716] focus:border-[#181716] focus:outline-hidden"
          />
        </div>
      )}

      {uploadError && (
        <div
          role="alert"
          className="border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-xs text-red-900"
        >
          {uploadError}
        </div>
      )}

      {/* Interactive Framing Studio & Live Site Preview */}
      {imageUrl && (
        <div className="border border-[#E5E1DA] bg-[#FAF9F6] p-4 sm:p-6 space-y-6">
          {/* INDEPENDENT DEVICE TARGET SELECTOR: CELULAR vs COMPUTADOR */}
          <div className="space-y-3 pb-4 border-b border-[#E5E1DA]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[#9E8765] font-medium">
                  <Sparkles size={12} />
                  <span>
                    Enquadramento Independente · Celular &amp; Computador Separados
                  </span>
                </p>
                <p className="text-xs text-[#6B6660] font-light">
                  Escolha abaixo qual tela deseja ajustar.{" "}
                  <strong>
                    Alterar o Celular não afeta o Computador, e alterar o
                    Computador não afeta o Celular.
                  </strong>
                </p>
              </div>

              <button
                type="button"
                onClick={copyFromOtherDevice}
                title={
                  editingDevice === "mobile"
                    ? "Copiar coordenadas do Computador para o Celular"
                    : "Copiar coordenadas do Celular para o Computador"
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#D8D3CB] bg-white text-[9px] uppercase tracking-[0.18em] text-[#6B6660] hover:text-[#181716] hover:border-[#181716] transition-colors shrink-0 cursor-pointer"
              >
                <Copy size={11} />
                <span>
                  {editingDevice === "mobile"
                    ? "Copiar do PC → Celular"
                    : "Copiar do Celular → PC"}
                </span>
              </button>
            </div>

            {/* Prominent Two-Column Device Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setEditingDevice("mobile")}
                className={`p-3.5 border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  editingDevice === "mobile"
                    ? "border-[#181716] bg-[#181716] text-white shadow-sm"
                    : "border-[#D8D3CB] bg-white text-[#4A453E] hover:border-[#9E8765]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Smartphone
                    size={18}
                    className={
                      editingDevice === "mobile"
                        ? "text-[#D4AF7A] shrink-0"
                        : "text-[#9E8765] shrink-0"
                    }
                  />
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold">
                      1. Ajustar Celular (Mobile)
                    </span>
                    <span
                      className={`block text-[11px] font-mono mt-0.5 ${
                        editingDevice === "mobile"
                          ? "text-white/80"
                          : "text-[#8C8780]"
                      }`}
                    >
                      X: {Math.round(framing.x)}% · Y: {Math.round(framing.y)}% ·
                      Zoom: {Math.round(framing.zoom * 100)}%
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] shrink-0 border ${
                    editingDevice === "mobile"
                      ? "border-[#D4AF7A] text-[#D4AF7A]"
                      : "border-[#E5E1DA] text-[#8C8780]"
                  }`}
                >
                  {editingDevice === "mobile" ? "Editando" : "Selecionar"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setEditingDevice("desktop")}
                className={`p-3.5 border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  editingDevice === "desktop"
                    ? "border-[#181716] bg-[#181716] text-white shadow-sm"
                    : "border-[#D8D3CB] bg-white text-[#4A453E] hover:border-[#9E8765]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Monitor
                    size={18}
                    className={
                      editingDevice === "desktop"
                        ? "text-[#D4AF7A] shrink-0"
                        : "text-[#9E8765] shrink-0"
                    }
                  />
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold">
                      2. Ajustar Computador (PC)
                    </span>
                    <span
                      className={`block text-[11px] font-mono mt-0.5 ${
                        editingDevice === "desktop"
                          ? "text-white/80"
                          : "text-[#8C8780]"
                      }`}
                    >
                      X: {Math.round(framing.desktop.x)}% · Y:{" "}
                      {Math.round(framing.desktop.y)}% · Zoom:{" "}
                      {Math.round(framing.desktop.zoom * 100)}%
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] shrink-0 border ${
                    editingDevice === "desktop"
                      ? "border-[#D4AF7A] text-[#D4AF7A]"
                      : "border-[#E5E1DA] text-[#8C8780]"
                  }`}
                >
                  {editingDevice === "desktop" ? "Editando" : "Selecionar"}
                </span>
              </button>
            </div>

            {/* Quick Presets for Active Device */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#8C8780]">
                Atalhos rápidos para{" "}
                <strong className="text-[#181716]">
                  {editingDevice === "mobile" ? "Celular" : "Computador (PC)"}
                </strong>
                :
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                {QUICK_PRESETS.map((preset) => {
                  const isCurrent =
                    Math.abs(activeViewport.x - preset.x) <= 2 &&
                    Math.abs(activeViewport.y - preset.y) <= 2;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        emitActiveViewportFraming({
                          x: preset.x,
                          y: preset.y,
                        })
                      }
                      className={`px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] border transition-colors cursor-pointer ${
                        isCurrent
                          ? "border-[#181716] bg-[#181716] text-white"
                          : "border-[#D8D3CB] bg-white text-[#6B6660] hover:border-[#9E8765] hover:text-[#181716]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    emitActiveViewportFraming({
                      x: 50,
                      y: editingDevice === "desktop" ? 50 : 0,
                      zoom: 1,
                    })
                  }
                  title={`Restaurar padrão apenas do ${
                    editingDevice === "mobile" ? "Celular" : "Computador"
                  }`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] border border-[#D8D3CB] bg-white text-[#8C8780] hover:text-[#181716] hover:border-[#181716] transition-colors cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>
                    Resetar {editingDevice === "mobile" ? "Celular" : "PC"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Interactive Drag-to-Frame Stage + Precision Sliders */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#6B6660]">
                <span className="inline-flex items-center gap-1.5">
                  <Move size={12} className="text-[#9E8765]" />
                  <span>
                    Palco{" "}
                    <strong className="text-[#181716]">
                      {editingDevice === "mobile"
                        ? "Celular"
                        : "Computador (PC)"}
                    </strong>{" "}
                    ({Math.round(activeViewport.x)}%{" "}
                    {Math.round(activeViewport.y)}% ·{" "}
                    {Math.round(activeViewport.zoom * 100)}%)
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => setShowGridOverlay((v) => !v)}
                  className={`inline-flex items-center gap-1 px-2 py-1 border text-[9px] uppercase tracking-[0.18em] transition-colors cursor-pointer ${
                    showGridOverlay
                      ? "border-[#9E8765] bg-[#9E8765]/10 text-[#181716]"
                      : "border-[#D8D3CB] bg-white text-[#8C8780]"
                  }`}
                >
                  <Grid3X3 size={11} />
                  <span>Grade 3×3</span>
                </button>
              </div>

              {/* Hero Desktop Mode Selector (Shown right above the stage when editing Desktop Hero) */}
              {previewContext?.mode === "hero" &&
                editingDevice === "desktop" && (
                  <div className="bg-white border border-[#E5E1DA] p-3 space-y-2">
                    <span className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660]">
                      Modo de Enquadramento no Computador (Monitor 16:9)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDesktopHeroFit("auto")}
                        className={`p-2.5 border text-left transition-colors cursor-pointer ${
                          !desktopHeroUsesCover
                            ? "border-[#181716] bg-[#181716] text-white"
                            : "border-[#E5E1DA] bg-[#FAF9F6] text-[#6B6660] hover:border-[#9E8765]"
                        }`}
                      >
                        <span className="block text-[9px] uppercase tracking-[0.18em] font-medium">
                          Foto Inteira + Atmosfera
                        </span>
                        <span
                          className={`block text-[10px] mt-0.5 ${
                            !desktopHeroUsesCover
                              ? "text-white/75"
                              : "text-[#8C8780]"
                          }`}
                        >
                          Mostra a foto inteira sem cortar (mova X ou dê Zoom)
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDesktopHeroFit("cover")}
                        className={`p-2.5 border text-left transition-colors cursor-pointer ${
                          desktopHeroUsesCover
                            ? "border-[#181716] bg-[#181716] text-white"
                            : "border-[#E5E1DA] bg-[#FAF9F6] text-[#6B6660] hover:border-[#9E8765]"
                        }`}
                      >
                        <span className="block text-[9px] uppercase tracking-[0.18em] font-medium">
                          Preencher Tela Cheia
                        </span>
                        <span
                          className={`block text-[10px] mt-0.5 ${
                            desktopHeroUsesCover
                              ? "text-white/75"
                              : "text-[#8C8780]"
                          }`}
                        >
                          Preenche 100% da tela e permite mover X e Y livremente
                        </span>
                      </button>
                    </div>
                  </div>
                )}

              {/* Interactive Drag / Click Canvas */}
              <div
                ref={stageRef}
                tabIndex={0}
                aria-label={`Palco de enquadramento para ${
                  editingDevice === "mobile" ? "Celular" : "Computador"
                } — arraste com o mouse ou use as setas do teclado`}
                onPointerDown={handleStagePointerDown}
                onPointerMove={handleStagePointerMove}
                onPointerUp={handleStagePointerUp}
                onLostPointerCapture={handleStageLostPointerCapture}
                onKeyDown={handleStageKeyDown}
                style={{
                  touchAction: "none",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                }}
                className={`relative ${stageAspectClass} max-h-[390px] mx-auto bg-[#141312] overflow-hidden border-2 border-[#9E8765] focus:outline-2 focus:outline-[#181716] ${
                  isDraggingStage ? "cursor-grabbing" : "cursor-grab"
                }`}
              >
                {/* Ambient Blur Layer when editing Desktop Hero in contain mode */}
                {stageUsesContain && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <Image
                      src={imageUrl}
                      alt=""
                      fill
                      sizes="360px"
                      className="object-cover object-center blur-xl opacity-35 scale-110"
                      quality={75}
                    />
                    <div className="absolute inset-0 bg-black/40" />
                  </div>
                )}

                <Image
                  src={imageUrl}
                  alt="Palco interativo de enquadramento"
                  fill
                  sizes="(max-width: 1024px) 100vw, 480px"
                  style={activeStageStyle}
                  className={`${
                    stageUsesContain ? "object-contain" : "object-cover"
                  } pointer-events-none transition-transform duration-75 z-5`}
                  quality={85}
                />

                {/* Rule-of-Thirds 3x3 Editorial Grid Overlay */}
                {(showGridOverlay || isDraggingStage) && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10"
                  >
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-white/30" />
                    <div className="border-r border-white/30" />
                    <div />
                  </div>
                )}

                {/* Focal Point Crosshair Marker */}
                <div
                  aria-hidden="true"
                  style={{
                    left: `${activeViewport.x}%`,
                    top: `${activeViewport.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 transition-all duration-75"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(158,135,101,0.95),0_4px_12px_rgba(0,0,0,0.45)] bg-[#9E8765]/35 flex items-center justify-center">
                    <Crosshair size={13} className="text-white" />
                  </div>
                </div>

                {/* Top Device Badge */}
                <div
                  aria-hidden="true"
                  className="absolute top-2.5 left-2.5 z-20 bg-[#181716]/85 backdrop-blur-xs text-[#D4AF7A] px-2.5 py-1 text-[8px] font-sans tracking-[0.2em] uppercase pointer-events-none border border-[#9E8765]/50"
                >
                  {editingDevice === "mobile"
                    ? "📱 Editando Celular"
                    : "🖥️ Editando Computador"}
                </div>

                {/* Live Floating Coordinate Pill */}
                <div
                  aria-hidden="true"
                  className="absolute bottom-2.5 left-2.5 z-20 bg-black/75 backdrop-blur-xs text-white px-2.5 py-1 text-[9px] font-mono tracking-wider uppercase pointer-events-none"
                >
                  X: {Math.round(activeViewport.x)}% · Y:{" "}
                  {Math.round(activeViewport.y)}% · Zoom:{" "}
                  {Math.round(activeViewport.zoom * 100)}%
                </div>
              </div>

              {/* Precision Controls: Zoom + Horizontal X + Vertical Y for Active Device */}
              <div className="bg-white border border-[#E5E1DA] p-4 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#F2EFE9]">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[#9E8765] font-medium">
                    Ajuste Fino Exclusivo para{" "}
                    {editingDevice === "mobile"
                      ? "Celular (Mobile)"
                      : "Computador (PC)"}
                  </span>
                </div>

                {/* Zoom Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#6B6660]">
                    <span className="inline-flex items-center gap-1.5">
                      <ZoomIn size={12} className="text-[#9E8765]" />
                      <span>
                        Zoom ({editingDevice === "mobile" ? "Celular" : "PC"})
                      </span>
                    </span>
                    <span className="font-mono text-[#181716] font-medium">
                      {Math.round(activeViewport.zoom * 100)}% (
                      {activeViewport.zoom.toFixed(2)}×)
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        emitActiveViewportFraming({
                          zoom: clampFramingZoom(activeViewport.zoom - 0.1, 1),
                        })
                      }
                      aria-label="Reduzir zoom"
                      className="p-1.5 border border-[#D8D3CB] text-[#6B6660] hover:text-[#181716] hover:border-[#181716] cursor-pointer"
                    >
                      <ZoomOut size={13} />
                    </button>

                    <input
                      type="range"
                      min={1}
                      max={2.4}
                      step={0.05}
                      value={activeViewport.zoom}
                      onChange={(e) =>
                        emitActiveViewportFraming({
                          zoom: Number.parseFloat(e.target.value),
                        })
                      }
                      aria-label="Zoom da imagem"
                      className="w-full accent-[#181716] cursor-pointer"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        emitActiveViewportFraming({
                          zoom: clampFramingZoom(activeViewport.zoom + 0.1, 1),
                        })
                      }
                      aria-label="Aumentar zoom"
                      className="p-1.5 border border-[#D8D3CB] text-[#6B6660] hover:text-[#181716] hover:border-[#181716] cursor-pointer"
                    >
                      <ZoomIn size={13} />
                    </button>
                  </div>
                </div>

                {/* Horizontal (X) & Vertical (Y) Fine Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#F2EFE9]">
                  <div>
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-[#6B6660] mb-1">
                      <span>
                        Horizontal X (
                        {editingDevice === "mobile" ? "Celular" : "PC"})
                      </span>
                      <span className="font-mono text-[#181716]">
                        {Math.round(activeViewport.x)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={activeViewport.x}
                      onChange={(e) =>
                        emitActiveViewportFraming({
                          x: Number.parseFloat(e.target.value),
                        })
                      }
                      aria-label="Posição horizontal X"
                      className="w-full accent-[#181716] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-[#6B6660] mb-1">
                      <span>
                        Vertical Y (
                        {editingDevice === "mobile" ? "Celular" : "PC"})
                      </span>
                      <span className="font-mono text-[#181716]">
                        {Math.round(activeViewport.y)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={activeViewport.y}
                      onChange={(e) =>
                        emitActiveViewportFraming({
                          y: Number.parseFloat(e.target.value),
                        })
                      }
                      aria-label="Posição vertical Y"
                      className="w-full accent-[#181716] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Live Site Simulator (Hero / Portfolio / About) */}
            <div className="lg:col-span-6 space-y-4">
              {/* CASE 1: HERO LIVE SITE SIMULATOR */}
              {previewContext?.mode === "hero" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#6B6660] font-medium">
                      Preview do Site Ao Vivo (Celular &amp; PC Independentes)
                    </span>

                    <div className="inline-flex border border-[#D8D3CB] bg-white">
                      <button
                        type="button"
                        onClick={() => setHeroPreviewTab("split")}
                        className={`px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] cursor-pointer ${
                          heroPreviewTab === "split"
                            ? "bg-[#181716] text-white"
                            : "text-[#6B6660] hover:text-[#181716]"
                        }`}
                      >
                        Ambos
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHeroPreviewTab("mobile");
                          setEditingDevice("mobile");
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] border-l border-[#D8D3CB] cursor-pointer ${
                          heroPreviewTab === "mobile"
                            ? "bg-[#181716] text-white"
                            : "text-[#6B6660] hover:text-[#181716]"
                        }`}
                      >
                        <Smartphone size={10} />
                        <span>Celular</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHeroPreviewTab("desktop");
                          setEditingDevice("desktop");
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] border-l border-[#D8D3CB] cursor-pointer ${
                          heroPreviewTab === "desktop"
                            ? "bg-[#181716] text-white"
                            : "text-[#6B6660] hover:text-[#181716]"
                        }`}
                      >
                        <Monitor size={10} />
                        <span>Computador</span>
                      </button>
                    </div>
                  </div>

                  <div
                    className={`grid gap-4 items-start ${
                      heroPreviewTab === "split"
                        ? "grid-cols-1 sm:grid-cols-12"
                        : "grid-cols-1"
                    }`}
                  >
                    {/* Mobile 9:16 Live Hero Simulator (Always uses mobileFramedStyle) */}
                    {(heroPreviewTab === "split" ||
                      heroPreviewTab === "mobile") && (
                      <div
                        onClick={() => setEditingDevice("mobile")}
                        className={`cursor-pointer ${
                          heroPreviewTab === "split"
                            ? "sm:col-span-5"
                            : "max-w-[240px] mx-auto w-full"
                        }`}
                      >
                        <div
                          className={`relative w-full aspect-[9/16] bg-[#141312] overflow-hidden shadow-md transition-all ${
                            editingDevice === "mobile"
                              ? "ring-2 ring-[#9E8765] border border-[#9E8765]"
                              : "border border-[#D8D3CB] opacity-90 hover:opacity-100"
                          }`}
                        >
                          <Image
                            src={imageUrl}
                            alt="Simulação Hero Celular"
                            fill
                            sizes="240px"
                            style={mobileFramedStyle}
                            className="object-cover brightness-[0.94] pointer-events-none"
                            quality={75}
                          />

                          {/* Authentic Top & Bottom Vignettes */}
                          <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />

                          {/* Simulated Mobile Navbar */}
                          <div className="absolute inset-x-0 top-2.5 px-3 flex items-center justify-between text-white pointer-events-none">
                            <div className="flex flex-col space-y-0.5 w-3">
                              <span className="w-3 h-[1px] bg-white/90" />
                              <span className="w-2 h-[1px] bg-white/90" />
                              <span className="w-2.5 h-[1px] bg-white/90" />
                            </div>
                            <div className="text-center">
                              <span className="block font-serif text-[7px] tracking-[0.22em] uppercase">
                                Kennedy Wanderson
                              </span>
                              <span className="block text-[4px] tracking-[0.35em] uppercase text-white/75">
                                Photographer
                              </span>
                            </div>
                            <div className="w-3" />
                          </div>

                          {/* Simulated Bottom Caption */}
                          <div className="absolute inset-x-0 bottom-2.5 px-3 text-center text-white pointer-events-none">
                            <p className="text-[6px] uppercase tracking-[0.28em] text-[#EFE8DE]/85 truncate">
                              {previewContext.tag || "Fine Art Portrait"}
                            </p>
                            <p className="font-serif italic text-[9px] text-white truncate mt-0.5">
                              {previewContext.captionTitle ||
                                "Legenda do Slide"}
                            </p>
                            <p className="text-[6px] tracking-[0.25em] text-white/70 mt-1">
                              {previewContext.slideNumberLabel || "01 — 05"}
                            </p>
                          </div>
                        </div>
                        <span className="block text-[9px] uppercase tracking-[0.18em] text-[#6B6660] mt-1.5 text-center">
                          📱 Celular (9:16) ·{" "}
                          {editingDevice === "mobile"
                            ? "Editando Agora"
                            : "Clique p/ Editar"}
                        </span>
                      </div>
                    )}

                    {/* Desktop 16:9 Live Hero Simulator (Always uses desktopFramedStyle) */}
                    {(heroPreviewTab === "split" ||
                      heroPreviewTab === "desktop") && (
                      <div
                        onClick={() => setEditingDevice("desktop")}
                        className={`cursor-pointer ${
                          heroPreviewTab === "split"
                            ? "sm:col-span-7"
                            : "w-full"
                        }`}
                      >
                        <div
                          className={`relative w-full aspect-[16/10] bg-[#141312] overflow-hidden shadow-md transition-all ${
                            editingDevice === "desktop"
                              ? "ring-2 ring-[#9E8765] border border-[#9E8765]"
                              : "border border-[#D8D3CB] opacity-90 hover:opacity-100"
                          }`}
                        >
                          {/* Ambient Blurred Layer when in contain/auto mode */}
                          {!desktopHeroUsesCover && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                              <Image
                                src={imageUrl}
                                alt=""
                                fill
                                sizes="320px"
                                className="object-cover object-center blur-xl opacity-35 scale-110"
                                quality={75}
                              />
                              <div className="absolute inset-0 bg-black/40" />
                            </div>
                          )}

                          {/* Main Desktop Slide Image */}
                          <div className="relative z-10 w-full h-full">
                            <Image
                              src={imageUrl}
                              alt="Simulação Hero Computador"
                              fill
                              sizes="360px"
                              style={desktopFramedStyle}
                              className={`${
                                desktopHeroUsesCover
                                  ? "object-cover"
                                  : "object-contain"
                              } brightness-[0.98] pointer-events-none`}
                              quality={75}
                            />
                          </div>

                          {/* Top & Bottom Vignettes */}
                          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/55 via-black/15 to-transparent pointer-events-none z-20" />
                          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 via-black/25 to-transparent pointer-events-none z-20" />

                          {/* Simulated Desktop Navbar */}
                          <div className="absolute inset-x-0 top-2.5 px-4 flex items-center justify-between text-white pointer-events-none z-20">
                            <span className="text-[6px] uppercase tracking-[0.25em] text-white/85">
                              ☰ Menu
                            </span>
                            <div className="text-center">
                              <span className="block font-serif text-[8px] tracking-[0.26em] uppercase">
                                Kennedy Wanderson
                              </span>
                              <span className="block text-[4.5px] tracking-[0.4em] uppercase text-white/75">
                                Photographer
                              </span>
                            </div>
                            <span className="w-6" />
                          </div>

                          {/* Simulated Desktop Bottom Caption */}
                          <div className="absolute inset-x-0 bottom-2.5 px-4 flex items-end justify-between text-white pointer-events-none z-20">
                            <div className="min-w-0 pr-2">
                              <p className="text-[6px] uppercase tracking-[0.3em] text-[#EFE8DE]/80 truncate">
                                {previewContext.tag || "Fine Art Portrait"}
                              </p>
                              <p className="font-serif italic text-[9px] text-white truncate">
                                {previewContext.captionTitle ||
                                  "Legenda do Slide"}
                              </p>
                            </div>
                            <span className="text-[6px] tracking-[0.25em] text-white/75 shrink-0">
                              {previewContext.slideNumberLabel || "01 — 05"}
                            </span>
                          </div>
                        </div>
                        <span className="block text-[9px] uppercase tracking-[0.18em] text-[#6B6660] mt-1.5 text-center">
                          🖥️ Computador (
                          {desktopHeroUsesCover
                            ? "Tela Cheia"
                            : "Foto Inteira"}
                          ) ·{" "}
                          {editingDevice === "desktop"
                            ? "Editando Agora"
                            : "Clique p/ Editar"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CASE 2: PORTFOLIO LIVE CARD & GRID SIMULATOR */}
              {previewContext?.mode === "portfolio" && (
                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#6B6660] font-medium">
                      Preview Ao Vivo ({editingDevice === "mobile" ? "📱 Celular" : "🖥️ Computador"})
                    </span>

                    <div className="inline-flex border border-[#D8D3CB] bg-white">
                      <button
                        type="button"
                        onClick={() => setPortfolioPreviewTab("card")}
                        className={`px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] cursor-pointer ${
                          portfolioPreviewTab === "card"
                            ? "bg-[#181716] text-white"
                            : "text-[#6B6660] hover:text-[#181716]"
                        }`}
                      >
                        Card Real
                      </button>
                      <button
                        type="button"
                        onClick={() => setPortfolioPreviewTab("grid")}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] border-l border-[#D8D3CB] cursor-pointer ${
                          portfolioPreviewTab === "grid"
                            ? "bg-[#181716] text-white"
                            : "text-[#6B6660] hover:text-[#181716]"
                        }`}
                      >
                        <LayoutGrid size={10} />
                        <span>Na Grade (PC)</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Aspect Ratio Selector right inside the Live Preview */}
                  {previewContext.onAspectClassChange && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {PORTFOLIO_ASPECT_PILLS.map((pill) => {
                        const active = effectiveAspectClass === pill.value;
                        return (
                          <button
                            key={pill.value}
                            type="button"
                            onClick={() =>
                              previewContext.onAspectClassChange?.(pill.value)
                            }
                            className={`py-1.5 px-2 border text-center transition-colors cursor-pointer ${
                              active
                                ? "border-[#181716] bg-[#181716] text-white"
                                : "border-[#D8D3CB] bg-white text-[#6B6660] hover:border-[#9E8765]"
                            }`}
                          >
                            <span className="block text-[10px] font-medium tracking-[0.15em]">
                              {pill.short}
                            </span>
                            <span
                              className={`block text-[8px] truncate ${
                                active ? "text-white/75" : "text-[#8C8780]"
                              }`}
                            >
                              {pill.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {portfolioPreviewTab === "card" ? (
                    /* Side-by-Side Mobile & Desktop Portfolio Card Comparison */
                    <div className="bg-white border border-[#E5E1DA] p-4 shadow-xs">
                      <div className="grid grid-cols-2 gap-4 items-start">
                        {/* Mobile Card Preview */}
                        <div
                          onClick={() => setEditingDevice("mobile")}
                          className={`p-2 border transition-all cursor-pointer ${
                            editingDevice === "mobile"
                              ? "border-[#9E8765] ring-1 ring-[#9E8765] bg-[#FAF9F6]"
                              : "border-transparent opacity-85 hover:opacity-100"
                          }`}
                        >
                          <span className="block text-[8px] uppercase tracking-[0.2em] text-[#9E8765] mb-1.5 font-medium">
                            📱 Card no Celular
                          </span>
                          <div
                            className={`relative w-full ${effectiveAspectClass} overflow-hidden bg-[#FAF9F6]`}
                          >
                            <Image
                              src={imageUrl}
                              alt="Preview do card no celular"
                              fill
                              sizes="200px"
                              style={mobileFramedStyle}
                              className="object-cover pointer-events-none"
                              quality={85}
                            />
                          </div>
                          <div className="pt-2.5 text-center">
                            <p className="text-[7px] uppercase tracking-[0.25em] text-[#8C8780] truncate">
                              {previewContext.location || "France"}
                            </p>
                            <h4 className="font-serif italic text-sm text-[#181716] font-light truncate">
                              {previewContext.title || "Título da História"}
                            </h4>
                          </div>
                        </div>

                        {/* Desktop Card Preview */}
                        <div
                          onClick={() => setEditingDevice("desktop")}
                          className={`p-2 border transition-all cursor-pointer ${
                            editingDevice === "desktop"
                              ? "border-[#9E8765] ring-1 ring-[#9E8765] bg-[#FAF9F6]"
                              : "border-transparent opacity-85 hover:opacity-100"
                          }`}
                        >
                          <span className="block text-[8px] uppercase tracking-[0.2em] text-[#9E8765] mb-1.5 font-medium">
                            🖥️ Card no Computador
                          </span>
                          <div
                            className={`relative w-full ${effectiveAspectClass} overflow-hidden bg-[#FAF9F6]`}
                          >
                            <Image
                              src={imageUrl}
                              alt="Preview do card no computador"
                              fill
                              sizes="200px"
                              style={desktopFramedStyle}
                              className="object-cover pointer-events-none"
                              quality={85}
                            />
                          </div>
                          <div className="pt-2.5 text-left">
                            <p className="text-[7px] uppercase tracking-[0.25em] text-[#8C8780] truncate">
                              {previewContext.location || "France"}
                            </p>
                            <h4 className="font-serif italic text-sm text-[#181716] font-light truncate">
                              {previewContext.title || "Título da História"}
                            </h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Grid Context (Desktop 12 Columns) */
                    <div className="bg-white border border-[#E5E1DA] p-4 space-y-3">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#8C8780]">
                        Proporção na fileira de 12 colunas no PC (
                        {previewContext.colSpan === "lg:col-span-4"
                          ? "1/3 da Linha"
                          : previewContext.colSpan === "lg:col-span-8"
                            ? "2/3 Destaque"
                            : previewContext.colSpan === "lg:col-span-12"
                              ? "Largura Total"
                              : "Meia Linha"}
                        )
                      </p>
                      <div className="grid grid-cols-12 gap-2.5 items-start bg-[#FAF9F6] p-3 border border-[#EFECE6]">
                        <div
                          className={
                            previewContext.colSpan === "lg:col-span-4"
                              ? "col-span-4"
                              : previewContext.colSpan === "lg:col-span-8"
                                ? "col-span-8"
                                : previewContext.colSpan === "lg:col-span-12"
                                  ? "col-span-12"
                                  : "col-span-6"
                          }
                        >
                          <div
                            className={`relative w-full ${effectiveAspectClass} overflow-hidden bg-white border border-[#9E8765]`}
                          >
                            <Image
                              src={imageUrl}
                              alt="Card na grade"
                              fill
                              sizes="220px"
                              style={desktopFramedStyle}
                              className="object-cover pointer-events-none"
                              quality={75}
                            />
                          </div>
                          <p className="font-serif italic text-[11px] text-[#181716] mt-1 truncate">
                            {previewContext.title || "Sua Foto"}
                          </p>
                        </div>

                        {previewContext.colSpan !== "lg:col-span-12" && (
                          <div
                            className={
                              previewContext.colSpan === "lg:col-span-4"
                                ? "col-span-4 opacity-45"
                                : previewContext.colSpan === "lg:col-span-8"
                                  ? "col-span-4 opacity-45"
                                  : "col-span-6 opacity-45"
                            }
                          >
                            <div
                              className={`w-full ${effectiveAspectClass} bg-[#E5E1DA] flex items-center justify-center text-[8px] uppercase tracking-widest text-[#6B6660]`}
                            >
                              Card Vizinho
                            </div>
                            <div className="h-2.5 w-20 bg-[#E5E1DA] mt-1.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CASE 3: ABOUT PORTRAIT OR DEFAULT LIVE PREVIEW */}
              {(!previewContext || previewContext.mode === "about") && (
                <div className="space-y-3">
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-[#6B6660] font-medium">
                    Preview Ao Vivo ({editingDevice === "mobile" ? "📱 Celular" : "🖥️ Computador"})
                  </span>

                  <div className="bg-white border border-[#E5E1DA] p-5">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-5">
                        <div
                          className={`relative w-full ${effectiveAspectClass} bg-[#EDE9E2] overflow-hidden border border-[#E5E1DA]`}
                        >
                          <Image
                            src={imageUrl}
                            alt="Preview do retrato"
                            fill
                            sizes="180px"
                            style={activeStageStyle}
                            className="object-cover pointer-events-none"
                            quality={75}
                          />
                        </div>
                        <span className="block text-[8px] uppercase tracking-[0.2em] text-[#8C8780] mt-1 text-center">
                          Moldura 4:5 ({editingDevice === "mobile" ? "Celular" : "PC"})
                        </span>
                      </div>

                      <div className="col-span-7 space-y-2.5 pt-1">
                        <p className="text-[8px] uppercase tracking-[0.3em] text-[#9E8765]">
                          {previewContext?.mode === "about" &&
                          previewContext.title
                            ? previewContext.title
                            : "Kennedy Wanderson"}
                        </p>
                        <p className="font-serif italic text-sm text-[#181716] leading-snug">
                          {previewContext?.mode === "about" &&
                          previewContext.subtitle
                            ? previewContext.subtitle
                            : "L'Art de raconter votre histoire avec vérité et poésie."}
                        </p>
                        <p className="text-[10px] text-[#59534B] font-light leading-relaxed line-clamp-4">
                          {previewContext?.mode === "about" &&
                          previewContext.paragraph1
                            ? previewContext.paragraph1
                            : "Com um olhar sensível para a luz natural e a espontaneidade dos gestos, cada imagem é pensada como uma herança visual atemporal."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
