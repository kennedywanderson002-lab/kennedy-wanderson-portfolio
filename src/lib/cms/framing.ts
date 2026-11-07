import type React from "react";

export type DesktopHeroFitMode = "auto" | "contain" | "cover";
export type FramingViewport = "mobile" | "desktop";

export interface ViewportFraming {
  /** Horizontal focal point percentage (0 to 100) */
  x: number;
  /** Vertical focal point percentage (0 to 100) */
  y: number;
  /** Scale / crop zoom factor (1 to 2.4) */
  zoom: number;
}

export interface ImageFramingConfig {
  /** Mobile (< 768px) framing coordinates and zoom */
  x: number;
  y: number;
  zoom: number;
  /** Independent Desktop (>= 768px) framing coordinates and zoom */
  desktop: ViewportFraming;
  /** Desktop Hero display mode ('auto' | 'contain' | 'cover') */
  desktopFit: DesktopHeroFitMode;
}

export const DEFAULT_IMAGE_FRAMING: ImageFramingConfig = {
  x: 50,
  y: 0,
  zoom: 1,
  desktop: {
    x: 50,
    y: 50,
    zoom: 1,
  },
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
 * and extended independent mobile + desktop framing strings
 * ("48% 15% @1.25 desktop=50,50,1 fit=cover") into a normalized ImageFramingConfig.
 */
export function parseImageFraming(
  raw?: string | null,
  fallbackY = 0
): ImageFramingConfig {
  if (!raw || !raw.trim()) {
    return {
      ...DEFAULT_IMAGE_FRAMING,
      y: fallbackY,
      desktop: { x: 50, y: fallbackY, zoom: 1 },
    };
  }

  const trimmed = raw.trim();

  if (trimmed === "object-top") {
    return {
      x: 50,
      y: 0,
      zoom: 1,
      desktop: { x: 50, y: 0, zoom: 1 },
      desktopFit: "auto",
    };
  }
  if (trimmed === "object-center") {
    return {
      x: 50,
      y: 50,
      zoom: 1,
      desktop: { x: 50, y: 50, zoom: 1 },
      desktopFit: "auto",
    };
  }
  if (trimmed === "object-bottom") {
    return {
      x: 50,
      y: 100,
      zoom: 1,
      desktop: { x: 50, y: 100, zoom: 1 },
      desktopFit: "auto",
    };
  }

  const legacyBracket = trimmed.match(/object-\[center_(\d+(?:\.\d+)?)%\]/);
  if (legacyBracket) {
    const yVal = clampFramingCoord(Number.parseFloat(legacyBracket[1]), fallbackY);
    return {
      x: 50,
      y: yVal,
      zoom: 1,
      desktop: { x: 50, y: yVal, zoom: 1 },
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

  // Extract the first two numeric tokens before any @, desktop=, or fit= modifier
  const corePart =
    trimmed.split(/@|\bdesktop=|\bfit=|\bzoom=/i)[0]?.trim() || "";
  const tokens = corePart.split(/\s+/).filter(Boolean);

  const parsedX = clampFramingCoord(
    Number.parseFloat((tokens[0] || "50").replace("%", "")),
    50
  );
  const parsedY = clampFramingCoord(
    Number.parseFloat((tokens[1] ?? String(fallbackY)).replace("%", "")),
    fallbackY
  );

  // Parse independent desktop framing if present: desktop=x,y,zoom
  let desktop: ViewportFraming = {
    x: parsedX,
    y: parsedY,
    zoom: 1,
  };

  const desktopMatch = trimmed.match(
    /\bdesktop=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i
  );
  if (desktopMatch) {
    desktop = {
      x: clampFramingCoord(Number.parseFloat(desktopMatch[1]), parsedX),
      y: clampFramingCoord(Number.parseFloat(desktopMatch[2]), parsedY),
      zoom: clampFramingZoom(Number.parseFloat(desktopMatch[3]), 1),
    };
  }

  return {
    x: parsedX,
    y: parsedY,
    zoom,
    desktop,
    desktopFit,
  };
}

/**
 * Serializes an ImageFramingConfig into a compact, 100% backwards-compatible string
 * stored in the existing `focal_point` database column.
 * Stores mobile framing as the primary prefix and desktop framing in `desktop=x,y,zoom`.
 */
export function serializeImageFraming(
  config: Partial<ImageFramingConfig>
): string {
  const x = clampFramingCoord(config.x ?? 50, 50);
  const y = clampFramingCoord(config.y ?? 0, 0);
  const zoom = clampFramingZoom(config.zoom ?? 1, 1);

  const desktopX = clampFramingCoord(config.desktop?.x ?? x, x);
  const desktopY = clampFramingCoord(config.desktop?.y ?? y, y);
  const desktopZoom = clampFramingZoom(config.desktop?.zoom ?? 1, 1);

  const desktopFit: DesktopHeroFitMode =
    config.desktopFit === "cover" || config.desktopFit === "contain"
      ? config.desktopFit
      : "auto";

  const parts = [`${formatNumberClean(x)}%`, `${formatNumberClean(y)}%`];

  if (zoom > 1.001) {
    parts.push(`@${zoom.toFixed(2).replace(/\.?0+$/, "")}`);
  }

  parts.push(
    `desktop=${formatNumberClean(desktopX)},${formatNumberClean(desktopY)},${desktopZoom.toFixed(2).replace(/\.?0+$/, "")}`
  );

  if (desktopFit !== "auto") {
    parts.push(`fit=${desktopFit}`);
  }

  return parts.join(" ");
}

/**
 * Generates direct inline CSS properties for a specific simulated viewport ("mobile" or "desktop").
 * Ideal for the Admin Studio drag stage and device simulators.
 */
export function getViewportFramedImageStyle(
  rawOrConfig?: string | ImageFramingConfig | null,
  viewport: FramingViewport = "mobile",
  extraScaleMultiplier = 1
): React.CSSProperties {
  const cfg =
    typeof rawOrConfig === "object" && rawOrConfig !== null
      ? rawOrConfig
      : parseImageFraming(rawOrConfig);

  const target: ViewportFraming =
    viewport === "desktop"
      ? cfg.desktop
      : { x: cfg.x, y: cfg.y, zoom: cfg.zoom };

  const objectPosition = `${formatNumberClean(target.x)}% ${formatNumberClean(target.y)}%`;
  const effectiveScale =
    Math.round(target.zoom * extraScaleMultiplier * 1000) / 1000;

  return {
    objectPosition,
    transformOrigin: objectPosition,
    ...(effectiveScale !== 1
      ? { transform: `scale(${effectiveScale})` }
      : {}),
  };
}

/**
 * Generates responsive CSS custom properties (`--fp-m-*` for mobile `< 768px`
 * and `--fp-d-*` for desktop `>= 768px`) to pair with `.cms-framed-image`.
 */
export function getResponsiveFramedImageStyle(
  rawOrConfig?: string | ImageFramingConfig | null
): React.CSSProperties {
  const cfg =
    typeof rawOrConfig === "object" && rawOrConfig !== null
      ? rawOrConfig
      : parseImageFraming(rawOrConfig);

  const mobilePos = `${formatNumberClean(cfg.x)}% ${formatNumberClean(cfg.y)}%`;
  const desktopPos = `${formatNumberClean(cfg.desktop.x)}% ${formatNumberClean(cfg.desktop.y)}%`;

  return {
    "--fp-m-pos": mobilePos,
    "--fp-m-scale": String(cfg.zoom),
    "--fp-d-pos": desktopPos,
    "--fp-d-scale": String(cfg.desktop.zoom),
  } as React.CSSProperties;
}

/**
 * Backwards-compatible alias for single-thumbnail previews in admin lists.
 */
export function getFramedImageStyle(
  rawOrConfig?: string | ImageFramingConfig | null,
  extraScaleMultiplier = 1
): React.CSSProperties {
  return getViewportFramedImageStyle(rawOrConfig, "mobile", extraScaleMultiplier);
}

/**
 * Formats a concise human-readable badge label for admin lists showing both Mobile and PC.
 */
export function formatFramingSummary(raw?: string | null): string {
  const cfg = parseImageFraming(raw);
  const mobZoom =
    cfg.zoom > 1.01 ? ` ${cfg.zoom.toFixed(2).replace(/\.?0+$/, "")}×` : "";
  const pcZoom =
    cfg.desktop.zoom > 1.01
      ? ` ${cfg.desktop.zoom.toFixed(2).replace(/\.?0+$/, "")}×`
      : "";
  const fitLabel =
    cfg.desktopFit === "cover"
      ? " · PC Tela Cheia"
      : cfg.desktopFit === "contain"
        ? " · PC Inteira"
        : "";
  return `Cel: ${Math.round(cfg.x)}% ${Math.round(cfg.y)}%${mobZoom} | PC: ${Math.round(cfg.desktop.x)}% ${Math.round(cfg.desktop.y)}%${pcZoom}${fitLabel}`;
}
