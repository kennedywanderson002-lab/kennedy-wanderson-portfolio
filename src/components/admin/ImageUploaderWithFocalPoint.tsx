"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import {
  UploadCloud,
  Crosshair,
  Loader2,
  Link2,
  RotateCcw,
} from "lucide-react";

interface ImageUploaderWithFocalPointProps {
  label: string;
  imageUrl: string;
  focalPoint: string;
  onImageChange: (url: string, blobPathname?: string | null) => void;
  onFocalPointChange: (focalPoint: string) => void;
  previewAspectClass?: string;
  helperText?: string;
}

function parseFocalPoint(fp: string): { x: number; y: number } {
  const parts = fp.trim().split(/\s+/);
  const x = Number.parseFloat(parts[0] || "50");
  const y = Number.parseFloat(parts[1] || "0");
  return {
    x: Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : 50,
    y: Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : 0,
  };
}

export function ImageUploaderWithFocalPoint({
  label,
  imageUrl,
  focalPoint,
  onImageChange,
  onFocalPointChange,
  previewAspectClass = "aspect-[4/5]",
  helperText,
}: ImageUploaderWithFocalPointProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);

  const coords = parseFocalPoint(focalPoint);

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
      const cleanName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "-");

      const blob = await upload(`portfolio/${cleanName}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });

      onImageChange(blob.url, blob.pathname);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Falha ao enviar imagem para o Vercel Blob.";
      setUploadError(
        msg.includes("503") || msg.includes("BLOB")
          ? "O Vercel Blob ainda não foi ativado (BLOB_READ_WRITE_TOKEN). Ative na aba Storage da Vercel ou informe uma URL abaixo."
          : msg
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePickerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pickerRef.current) return;
    const rect = pickerRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    const relY = ((e.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.round(Math.min(100, Math.max(0, relX)));
    const clampedY = Math.round(Math.min(100, Math.max(0, relY)));
    onFocalPointChange(`${clampedX}% ${clampedY}%`);
  };

  return (
    <div className="space-y-4">
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

      {/* Upload Dropzone Button */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const dropped = e.dataTransfer.files?.[0];
          void handleFileSelect(dropped);
        }}
        className="border border-dashed border-[#C9C2B8] bg-[#FAF9F6] hover:border-[#9E8765] transition-colors p-5 text-center"
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
                <span>{imageUrl ? "Trocar Fotografia" : "Enviar Fotografia HD"}</span>
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

      {/* Interactive Focal Point Picker + Framing Previews */}
      {imageUrl && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2 border-t border-[#EFECE6]">
          {/* Clickable Full Reference Photo */}
          <div className="md:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#6B6660]">
              <span className="inline-flex items-center gap-1.5">
                <Crosshair size={12} className="text-[#9E8765]" />
                <span>Clique na foto para definir o Ponto Focal ({focalPoint})</span>
              </span>
              <button
                type="button"
                onClick={() => onFocalPointChange("50% 0%")}
                className="inline-flex items-center gap-1 text-[#8C8780] hover:text-[#181716] cursor-pointer"
                title="Restaurar topo central (50% 0%)"
              >
                <RotateCcw size={11} />
                <span>Topo</span>
              </button>
            </div>

            <div
              ref={pickerRef}
              onClick={handlePickerClick}
              className="relative w-full aspect-[4/3] bg-[#141312] overflow-hidden cursor-crosshair select-none border border-[#E5E1DA]"
            >
              <Image
                src={imageUrl}
                alt="Seletor de ponto focal"
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-contain pointer-events-none"
                quality={75}
              />

              {/* Crosshair Marker */}
              <div
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
              >
                <div className="w-7 h-7 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(158,135,101,0.95)] bg-[#9E8765]/30 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Live Crop Simulation (Card + Mobile Vertical) */}
          <div className="md:col-span-5 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6660]">
              Prévia de Recorte Automático
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div
                  className={`relative w-full ${previewAspectClass} bg-[#FAF9F6] overflow-hidden border border-[#E5E1DA]`}
                >
                  <Image
                    src={imageUrl}
                    alt="Prévia do card"
                    fill
                    sizes="180px"
                    style={{ objectPosition: focalPoint }}
                    className="object-cover"
                    quality={75}
                  />
                </div>
                <span className="block text-[9px] uppercase tracking-[0.2em] text-[#8C8780] mt-1 text-center">
                  Grade / Card
                </span>
              </div>

              <div>
                <div className="relative w-full aspect-[9/16] max-h-44 mx-auto bg-[#FAF9F6] overflow-hidden border border-[#E5E1DA]">
                  <Image
                    src={imageUrl}
                    alt="Prévia mobile"
                    fill
                    sizes="160px"
                    style={{ objectPosition: focalPoint }}
                    className="object-cover"
                    quality={75}
                  />
                </div>
                <span className="block text-[9px] uppercase tracking-[0.2em] text-[#8C8780] mt-1 text-center">
                  Tela Mobile
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

