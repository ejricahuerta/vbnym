import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Black, Archivo_Narrow, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import { CookieConsentPopup } from "@/components/layout/cookie-consent-popup";
import { PageSplash } from "@/components/layout/page-splash";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});
const archivoNarrow = Archivo_Narrow({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "6IX BACK Volleyball",
  description: "Drop-in volleyball games, leagues, and tournaments across Toronto and the GTA.",
  icons: {
    icon: "/6ix-back-logo.svg",
    apple: "/6ix-back-logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased font-sans",
        archivo.variable,
        archivoBlack.variable,
        archivoNarrow.variable,
        fraunces.variable,
        jetBrainsMono.variable
      )}
    >
      <body suppressHydrationWarning>
        {children}
        <Analytics />
        <PageSplash />
        <CookieConsentPopup />
      </body>
    </html>
  );
}
