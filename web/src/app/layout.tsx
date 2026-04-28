import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Archivo, Archivo_Black, Fraunces, JetBrains_Mono } from "next/font/google";

import { CookieConsentBanner } from "@/components/shared/CookieConsentBanner";

import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-ui" });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-serif" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "6ix Back Volleyball",
  description: "Drop-ins, leagues, and tournaments with Interac payment code matching.",
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
