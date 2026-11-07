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
} from "lucide-react";
import { uploadAdminImage } from "@/lib/cms/upload-client";
import {
  clampFramingCoord,
  clampFramingZoom,
  getFramedImageStyle,
  parseImageFraming,
  serializeImageFraming,
  type DesktopHeroFitMode,
  type ImageFramingConfig,
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

  const emitFraming = (patch: Partial<ImageFramingConfig>) => {
    const next: ImageFramingConfig = {
      ...framing,
      ...patch,
    };
    onFocalPointChange(serializeImageFraming(next));
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
      startX: framing.x,
      startY: framing.y,
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
    const sensitivity = 100 / Math.max(1, framing.zoom * 0.85);
    const nextX = clampFramingCoord(
      session.startX - (dx / width) * sensitivity,
      framing.x
    );
    const nextY = clampFramingCoord(
      session.startY - (dy / height) * sensitivity,
      framing.y
    );

    emitFraming({ x: nextX, y: nextY });
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
      emitFraming({
        x: clampFramingCoord(relX, framing.x),
        y: clampFramingCoord(relY, framing.y),
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
      emitFraming({ x: clampFramingCoord(framing.x - step, framing.x) });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      emitFraming({ x: clampFramingCoord(framing.x + step, framing.x) });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      emitFraming({ y: clampFramingCoord(framing.y - step, framing.y) });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      emitFraming({ y: clampFramingCoord(framing.y + step, framing.y) });
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      emitFraming({ zoom: clampFramingZoom(framing.zoom + 0.1, framing.zoom) });
    } else if (e.key === "-") {
      e.preventDefault();
      emitFraming({ zoom: clampFramingZoom(framing.zoom - 0.1, framing.zoom) });
    }
  };

  const effectiveAspectClass =
    previewContext?.mode === "portfolio" && previewContext.aspectClass
      ? previewContext.aspectClass
      : previewAspectClass;

  const framedStyle = getFramedImageStyle(framing);

  const desktopHeroUsesCover = framing.desktopFit === "cover";

  const setDesktopHeroFit = (mode: DesktopHeroFitMode) => {
    emitFraming({ desktopFit: mode });
  };

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
          {/* Top Studio Bar: Instructions + Presets + Reset */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#E5E1DA]">
            <div className="space-y-0.5">
              <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-[#9E8765] font-medium">
                <Sparkles size={12} />
                <span>Estúdio de Enquadramento &amp; Preview Ao Vivo</span>
              </p>
              <p className="text-xs text-[#6B6660] font-light">
                <strong>Arraste a foto</strong> dentro do quadro (ou clique no
                ponto principal) e ajuste o <strong>Zoom</strong> vendo ao lado
                como ficará publicado no site.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_PRESETS.map((preset) => {
                const isCurrent =
                  Math.abs(framing.x - preset.x) <= 2 &&
                  Math.abs(framing.y - preset.y) <= 2;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => emitFraming({ x: preset.x, y: preset.y })}
                    className={`px-2.5 py-1.5 text-[9px] uppercase tracking-[0.18em] border transition-colors cursor-pointer ${
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
                  emitFraming({
                    x: 50,
                    y: 0,
                    zoom: 1,
                    desktopFit: "auto",
                  })
                }
                title="Restaurar enquadramento padrão (50% 0% · 1.0×)"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.18em] border border-[#D8D3CB] bg-white text-[#8C8780] hover:text-[#181716] hover:border-[#181716] transition-colors cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Resetar</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Interactive Drag-to-Frame Stage + Precision Sliders */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#6B6660]">
                <span className="inline-flex items-center gap-1.5">
                  <Move size={12} className="text-[#9E8765]" />
                  <span>
                    Arraste ou clique na foto ({Math.round(framing.x)}%{" "}
                    {Math.round(framing.y)}% ·{" "}
                    {Math.round(framing.zoom * 100)}%)
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

              {/* Interactive Drag / Click Canvas */}
              <div
                ref={stageRef}
                tabIndex={0}
                aria-label="Palco de enquadramento da fotografia — arraste com o mouse ou use as setas do teclado para posicionar a imagem"
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
                className={`relative w-full ${
                  previewContext?.mode === "hero"
                    ? "aspect-[4/5] max-h-[380px]"
                    : effectiveAspectClass
                } max-h-[400px] mx-auto bg-[#141312] overflow-hidden border border-[#D8D3CB] focus:outline-2 focus:outline-[#9E8765] ${
                  isDraggingStage ? "cursor-grabbing" : "cursor-grab"
                }`}
              >
                <Image
                  src={imageUrl}
                  alt="Palco interativo de enquadramento"
                  fill
                  sizes="(max-width: 1024px) 100vw, 480px"
                  style={framedStyle}
                  className="object-cover pointer-events-none transition-transform duration-75"
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
                  style={{ left: `${framing.x}%`, top: `${framing.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 transition-all duration-75"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(158,135,101,0.95),0_4px_12px_rgba(0,0,0,0.45)] bg-[#9E8765]/35 flex items-center justify-center">
                    <Crosshair size={13} className="text-white" />
                  </div>
                </div>

                {/* Live Floating Coordinate Pill */}
                <div
                  aria-hidden="true"
                  className="absolute bottom-2.5 left-2.5 z-20 bg-black/75 backdrop-blur-xs text-white px-2.5 py-1 text-[9px] font-mono tracking-wider uppercase pointer-events-none"
                >
                  X: {Math.round(framing.x)}% · Y: {Math.round(framing.y)}% ·
                  Zoom: {Math.round(framing.zoom * 100)}%
                </div>
              </div>

              {/* Precision Controls: Zoom + Horizontal X + Vertical Y */}
              <div className="bg-white border border-[#E5E1DA] p-4 space-y-3.5">
                {/* Zoom Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#6B6660]">
                    <span className="inline-flex items-center gap-1.5">
                      <ZoomIn size={12} className="text-[#9E8765]" />
                      <span>Zoom / Aproximação do Corte</span>
                    </span>
                    <span className="font-mono text-[#181716] font-medium">
                      {Math.round(framing.zoom * 100)}% (
                      {framing.zoom.toFixed(2)}×)
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        emitFraming({
                          zoom: clampFramingZoom(framing.zoom - 0.1, 1),
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
                      value={framing.zoom}
                      onChange={(e) =>
                        emitFraming({
                          zoom: Number.parseFloat(e.target.value),
                        })
                      }
                      aria-label="Zoom da imagem"
                      className="w-full accent-[#181716] cursor-pointer"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        emitFraming({
                          zoom: clampFramingZoom(framing.zoom + 0.1, 1),
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
                      <span>Posição Horizontal (X)</span>
                      <span className="font-mono text-[#181716]">
                        {Math.round(framing.x)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={framing.x}
                      onChange={(e) =>
                        emitFraming({ x: Number.parseFloat(e.target.value) })
                      }
                      aria-label="Posição horizontal X"
                      className="w-full accent-[#181716] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-[#6B6660] mb-1">
                      <span>Posição Vertical (Y)</span>
                      <span className="font-mono text-[#181716]">
                        {Math.round(framing.y)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={framing.y}
                      onChange={(e) =>
                        emitFraming({ y: Number.parseFloat(e.target.value) })
                      }
                      aria-label="Posição vertical Y"
                      className="w-full accent-[#181716] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Hero Desktop Fit Mode Selector */}
                {previewContext?.mode === "hero" && (
                  <div className="pt-2.5 border-t border-[#F2EFE9] space-y-2">
                    <span className="block text-[9px] uppercase tracking-[0.2em] text-[#6B6660]">
                      Exibição no Computador (Monitor Widescreen)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDesktopHeroFit("auto")}
                        className={`p-2 border text-left transition-colors cursor-pointer ${
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
                          Preserva o corpo todo no PC
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDesktopHeroFit("cover")}
                        className={`p-2 border text-left transition-colors cursor-pointer ${
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
                          Usa o seu corte X/Y no PC
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Live Site Simulator (Hero / Portfolio / About) */}
            <div className="lg:col-span-6 space-y-4">
              {/* CASE 1: HERO LIVE SITE SIMULATOR */}
              {previewContext?.mode === "hero" && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#6B6660] font-medium">
                      Preview do Site Ao Vivo (Capa Hero)
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
                        onClick={() => setHeroPreviewTab("mobile")}
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
                        onClick={() => setHeroPreviewTab("desktop")}
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
                    {/* Mobile 9:16 Live Hero Simulator */}
                    {(heroPreviewTab === "split" ||
                      heroPreviewTab === "mobile") && (
                      <div
                        className={
                          heroPreviewTab === "split"
                            ? "sm:col-span-5"
                            : "max-w-[240px] mx-auto w-full"
                        }
                      >
                        <div className="relative w-full aspect-[9/16] bg-[#141312] overflow-hidden border border-[#D8D3CB] shadow-md">
                          <Image
                            src={imageUrl}
                            alt="Simulação Hero Celular"
                            fill
                            sizes="240px"
                            style={framedStyle}
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
                        <span className="block text-[9px] uppercase tracking-[0.2em] text-[#8C8780] mt-1.5 text-center">
                          Celular Ao Vivo (9:16)
                        </span>
                      </div>
                    )}

                    {/* Desktop 16:9 Live Hero Simulator */}
                    {(heroPreviewTab === "split" ||
                      heroPreviewTab === "desktop") && (
                      <div
                        className={
                          heroPreviewTab === "split"
                            ? "sm:col-span-7"
                            : "w-full"
                        }
                      >
                        <div className="relative w-full aspect-[16/10] bg-[#141312] overflow-hidden border border-[#D8D3CB] shadow-md">
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
                              style={framedStyle}
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
                        <span className="block text-[9px] uppercase tracking-[0.2em] text-[#8C8780] mt-1.5 text-center">
                          Computador Ao Vivo (
                          {desktopHeroUsesCover
                            ? "Tela Cheia"
                            : "Foto Inteira + Atmosfera"}
                          )
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
                      Preview do Card Ao Vivo no Portfólio
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
                        <span>Na Grade + Mobile</span>
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
                    /* Authentic Portfolio Card Simulation with Editorial Caption Underneath */
                    <div className="bg-white border border-[#E5E1DA] p-5 shadow-xs">
                      <div className="max-w-[270px] mx-auto">
                        <div
                          className={`relative w-full ${effectiveAspectClass} overflow-hidden bg-[#FAF9F6]`}
                        >
                          <Image
                            src={imageUrl}
                            alt="Preview do card no site"
                            fill
                            sizes="280px"
                            style={framedStyle}
                            className="object-cover pointer-events-none"
                            quality={85}
                          />
                        </div>

                        {/* Authentic Jose Villa Editorial Caption Underneath */}
                        <div className="pt-3.5 text-left">
                          <p className="text-[8px] uppercase tracking-[0.3em] text-[#8C8780] font-sans">
                            {previewContext.location || "France"}
                          </p>
                          <h4 className="font-serif italic text-lg text-[#181716] font-light mt-0.5 truncate">
                            {previewContext.title || "Título da História"}
                          </h4>
                          {previewContext.camera && (
                            <p className="text-[9px] font-mono text-[#9C968F] mt-0.5 tracking-wider uppercase truncate">
                              {previewContext.camera.split("·")[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Grid Context + Mobile 9:16 Comparison */
                    <div className="bg-white border border-[#E5E1DA] p-4 space-y-3">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#8C8780]">
                        Proporção na fileira de 12 colunas (
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
                              style={framedStyle}
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
                    Preview Ao Vivo na Página
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
                            style={framedStyle}
                            className="object-cover pointer-events-none"
                            quality={75}
                          />
                        </div>
                        <span className="block text-[8px] uppercase tracking-[0.2em] text-[#8C8780] mt-1 text-center">
                          Moldura 4:5
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
