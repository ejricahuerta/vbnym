import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Archivo, Archivo_Black, Fraunces, JetBrains_Mono } from "next/font/google";

import { CookieConsentBanner } from "@/components/shared/CookieConsentBanner";
import { getSeoSiteConfig } from "@/lib/seo";

import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-ui" });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-serif" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const site = getSeoSiteConfig();

export const metadata: Metadata = {
  metadataBase: site.baseUrl,
  title: {
    default: "6ix Back Volleyball",
    template: "%s | 6ix Back Volleyball",
  },
  description: site.description,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "6ix Back Volleyball",
    description: site.description,
    url: "/",
    siteName: site.siteName,
    locale: "en_CA",
    type: "website",
    images: [{ url: site.defaultOgImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "6ix Back Volleyball",
    description: site.description,
    images: [site.defaultOgImage],
  },
  icons: {
    icon: "/6ix-back-logo.png",
    apple: "/6ix-back-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${archivo.variable} ${archivoBlack.variable} ${fraunces.variable} ${jetBrainsMono.variable}`}
      >
        {children}
        <CookieConsentBanner />
        <Analytics />
      </body>
    </html>
  );
}
