import type { Locale } from "./translations";

export interface HeroSlideData {
  id: string;
  image: string;
  blobPathname?: string | null;
  title: Record<Locale, string>;
  tag: string;
  aspectRatio: "portrait" | "landscape";
  focalPoint: string; // CSS object-position value, e.g. "50% 0%" or "50% 32%"
  sortOrder: number;
  isVisible: boolean;
}

export const defaultHeroSlides: HeroSlideData[] = [
  {
    id: "hero-slide-1",
    image: "/images/real/49390.jpg.jpeg",
    title: {
      fr: "Lumière Dorée & Douceur Poétique · France",
      en: "Golden Hour Glow & Poetic Grace · France",
      pt: "Luz Dourada & Poesia Visual · França",
    },
    tag: "Fine Art Portrait",
    aspectRatio: "portrait",
    focalPoint: "50% 0%",
    sortOrder: 0,
    isVisible: true,
  },
  {
    id: "hero-slide-2",
    image: "/images/real/39777.jpg.jpeg",
    title: {
      fr: "Falaises d'Étretat · Normandie, France",
      en: "Étretat Sea Cliffs · Normandy, France",
      pt: "Falésias de Étretat · Normandia, França",
    },
    tag: "Destination Session",
    aspectRatio: "portrait",
    focalPoint: "50% 32%",
    sortOrder: 1,
    isVisible: true,
  },
  {
    id: "hero-slide-3",
    image: "/images/real/32772.jpg.jpeg",
    title: {
      fr: "Célébration & Guirlandes Étoilées · France",
      en: "Wedding Celebration & Fairy Lights · France",
      pt: "Celebração de Casamento & Luzes · França",
    },
    tag: "Wedding Celebration",
    aspectRatio: "landscape",
    focalPoint: "50% 20%",
    sortOrder: 2,
    isVisible: true,
  },
  {
    id: "hero-slide-4",
    image: "/images/real/32790.jpg.jpeg",
    title: {
      fr: "Douceur & Voile au Crépuscule · France",
      en: "Bridal Veil & Twilight Romance · France",
      pt: "Véu da Noiva & Romance ao Entardecer · França",
    },
    tag: "Bridal Portrait",
    aspectRatio: "portrait",
    focalPoint: "50% 0%",
    sortOrder: 3,
    isVisible: true,
  },
  {
    id: "hero-slide-5",
    image: "/images/real/19229.jpg.jpeg",
    title: {
      fr: "Art de Vivre & Ruelles Fleuries · France",
      en: "French Heritage Village & Art de Vivre · France",
      pt: "Vilarejo Histórico & Charme Francês · França",
    },
    tag: "Editorial & Lifestyle",
    aspectRatio: "portrait",
    focalPoint: "50% 0%",
    sortOrder: 4,
    isVisible: true,
  },
];

