import type React from "react";

export type DesktopHeroFitMode = "auto" | "contain" | "cover";

export interface ImageFramingConfig {
  x: number;
  y: number;
  zoom: number;
  desktopFit: DesktopHeroFitMode;
}

export const DEFAULT_IMAGE_FRAMING: ImageFramingConfig = {
  x: 50,
  y: 0,
  zoom: 1,
  desktopFit: "auto",
};

export function clampFramingCoord(val: number, fallback = 50): number {
  if (!Number.isFinite(val)) return fallback;
  const clamped = Math.min(100, Math.max(0, val));
  return Math.round(clamped * 2) / 2;
}

export function clampFramingZoom(val: number, fallback = 1): number {
  if (!Number.isFinite(val)) return fallback;
  const clamped = Math.min(2.4, Math.max(1, val));
  return Math.round(clamped * 100) / 100;
}

function formatNumberClean(val: number): string {
  return Number.isInteger(val) ? String(val) : val.toFixed(1).replace(/\.0$/, "");
}

/**
 * Parses legacy Tailwind object-position classes, standard "X% Y%" strings,
 * and extended framing strings ("X% Y% @1.35 fit=cover") into a normalized ImageFramingConfig.
 */
export function parseImageFraming(
  raw?: string | null,
  fallbackY = 0
): ImageFramingConfig {
  if (!raw || !raw.trim()) {
    return { ...DEFAULT_IMAGE_FRAMING, y: fallbackY };
  }

  const trimmed = raw.trim();

  if (trimmed === "object-top") {
    return { x: 50, y: 0, zoom: 1, desktopFit: "auto" };
  }
  if (trimmed === "object-center") {
    return { x: 50, y: 50, zoom: 1, desktopFit: "auto" };
  }
  if (trimmed === "object-bottom") {
    return { x: 50, y: 100, zoom: 1, desktopFit: "auto" };
  }

  const legacyBracket = trimmed.match(/object-\[center_(\d+(?:\.\d+)?)%\]/);
  if (legacyBracket) {
    return {
      x: 50,
      y: clampFramingCoord(Number.parseFloat(legacyBracket[1]), fallbackY),
      zoom: 1,
      desktopFit: "auto",
    };
  }

  let desktopFit: DesktopHeroFitMode = "auto";
  if (/\bfit=cover\b/i.test(trimmed)) {
    desktopFit = "cover";
  } else if (/\bfit=contain\b/i.test(trimmed)) {
    desktopFit = "contain";
  }

  let zoom = 1;
  const zoomMatch =
    trimmed.match(/@(\d+(?:\.\d+)?)/) ||
    trimmed.match(/\bzoom=(\d+(?:\.\d+)?)/i);
  if (zoomMatch) {
    zoom = clampFramingZoom(Number.parseFloat(zoomMatch[1]), 1);
  }

  // Extract the first two numeric tokens before any @ or fit= modifier
  const corePart = trimmed.split(/@|\bfit=|\bzoom=/i)[0]?.trim() || "";
  const tokens = corePart.split(/\s+/).filter(Boolean);

  const parsedX = Number.parseFloat((tokens[0] || "50").replace("%", ""));
  const parsedY = Number.parseFloat(
    (tokens[1] ?? String(fallbackY)).replace("%", "")
  );

  return {
    x: clampFramingCoord(parsedX, 50),
    y: clampFramingCoord(parsedY, fallbackY),
    zoom,
    desktopFit,
  };
}

/**
 * Serializes an ImageFramingConfig into a compact, 100% backwards-compatible string
 * stored in the existing `focal_point` database column.
 */
export function serializeImageFraming(
  config: Partial<ImageFramingConfig>
): string {
  const x = clampFramingCoord(config.x ?? 50, 50);
  const y = clampFramingCoord(config.y ?? 0, 0);
  const zoom = clampFramingZoom(config.zoom ?? 1, 1);
  const desktopFit: DesktopHeroFitMode =
    config.desktopFit === "cover" || config.desktopFit === "contain"
      ? config.desktopFit
      : "auto";

  const parts = [`${formatNumberClean(x)}%`, `${formatNumberClean(y)}%`];

  if (zoom > 1.001) {
    parts.push(`@${zoom.toFixed(2).replace(/0$/, "")}`);
  }

  if (desktopFit !== "auto") {
    parts.push(`fit=${desktopFit}`);
  }

  return parts.join(" ");
}

/**
 * Generates inline CSS properties (`objectPosition`, `transformOrigin`, and `transform`)
 * for Next.js `<Image />` components so both pan and zoom anchor accurately around (X%, Y%).
 */
export function getFramedImageStyle(
  rawOrConfig?: string | ImageFramingConfig | null,
  extraScaleMultiplier = 1
): React.CSSProperties {
  const cfg =
    typeof rawOrConfig === "object" && rawOrConfig !== null
      ? rawOrConfig
      : parseImageFraming(rawOrConfig);

  const objectPosition = `${formatNumberClean(cfg.x)}% ${formatNumberClean(cfg.y)}%`;
  const effectiveScale =
    Math.round(cfg.zoom * extraScaleMultiplier * 1000) / 1000;

  return {
    objectPosition,
    transformOrigin: objectPosition,
    ...(effectiveScale !== 1
      ? { transform: `scale(${effectiveScale})` }
      : {}),
  };
}

/**
 * Formats a concise human-readable badge label for admin lists (e.g. "50% 15% · 1.25×").
 */
export function formatFramingSummary(raw?: string | null): string {
  const cfg = parseImageFraming(raw);
  const base = `${Math.round(cfg.x)}% ${Math.round(cfg.y)}%`;
  const zoomLabel = cfg.zoom > 1.01 ? ` · ${cfg.zoom.toFixed(2).replace(/\.?0+$/, "")}×` : "";
  const fitLabel =
    cfg.desktopFit === "cover"
      ? " · Tela Cheia"
      : cfg.desktopFit === "contain"
        ? " · Inteira"
        : "";
  return `${base}${zoomLabel}${fitLabel}`;
}

