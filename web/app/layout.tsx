import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, DM_Sans, Raleway } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import { CookieConsentPopup } from "@/components/layout/cookie-consent-popup";
import { PageSplash } from "@/components/layout/page-splash";

const ralewayHeading = Raleway({subsets:['latin'],variable:'--font-heading'});

const dmSans = DM_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NYM Volleyball",
  description: "Drop-in volleyball games — North York & Markham area.",
  icons: {
    icon: "/nym-logo.png",
    apple: "/nym-logo.png",
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
      className={cn("antialiased", geistSans.variable, geistMono.variable, "font-sans", dmSans.variable, ralewayHeading.variable)}
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
