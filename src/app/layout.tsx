import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FAF8F5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://kennedywanderson.com"),
  title: "Kennedy Wanderson | Fine Art Wedding & Editorial Photographer",
  description: "Exquisite fine art wedding and editorial photography based in France. Available for commissioned destination celebrations across Paris, Provence, Lake Como, Italy, and worldwide.",
  keywords: [
    "Kennedy Wanderson",
    "Fine Art Wedding Photographer France",
    "Photographe Mariage France",
    "Destination Wedding Europe",
    "Lake Como Wedding Photographer",
    "Paris Wedding Photographer",
    "Editorial Wedding Photography",
    "Château Wedding Photography"
  ],
  authors: [{ name: "Kennedy Wanderson" }],
  openGraph: {
    title: "Kennedy Wanderson | Fine Art Wedding & Editorial Photographer",
    description: "Capturing timeless grace, luminous romance, and authentic emotion across France and European destinations.",
    url: "https://kennedywanderson.com",
    siteName: "Kennedy Wanderson Photography",
    images: [
      {
        url: "/images/real/49390.jpg.jpeg",
        width: 1200,
        height: 800,
        alt: "Kennedy Wanderson Fine Art Photography",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${jakarta.variable} scroll-smooth`}
    >
      <body className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1A18] font-sans antialiased selection:bg-[#EADBCE]">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
