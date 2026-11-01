import type { Locale, Translations } from "@/data/translations";
import type { PortfolioProject } from "@/data/portfolio";

export interface CmsPortfolioImage {
  id: string;
  imageUrl: string;
  blobPathname?: string | null;
  altText?: string;
  sortOrder: number;
}

export interface CmsPortfolioProject extends PortfolioProject {
  focalPoint: string;
  coverBlobPathname?: string | null;
  sortOrder: number;
  isVisible: boolean;
  images: CmsPortfolioImage[];
}

export interface CmsSiteSettings {
  translations: Record<Locale, Translations>;
  showAboutPortrait: boolean;
  aboutPortraitUrl: string | null;
  aboutPortraitBlobPathname: string | null;
  aboutPortraitFocalPoint: string;
  contactEmail: string;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  instagramUrl: string;
}

export interface CmsInquiryItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  eventDate: string;
  destination: string;
  guestCount: string;
  message: string;
  locale: string;
  status: "new" | "contacted" | "archived";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Converts legacy Tailwind object-position class names from portfolio.ts
 * into standard CSS object-position percentage strings (e.g. "50% 20%").
 */
export function legacyObjectPositionToFocalPoint(objectPos?: string): string {
  if (!objectPos) return "50% 0%";
  if (objectPos === "object-top") return "50% 0%";
  if (objectPos === "object-center") return "50% 50%";
  if (objectPos === "object-bottom") return "50% 100%";
  const match = objectPos.match(/object-\[center_(\d+)%\]/);
  if (match) {
    return `50% ${match[1]}%`;
  }
  return "50% 0%";
}

