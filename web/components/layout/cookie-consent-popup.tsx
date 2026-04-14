"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Cookie, X } from "lucide-react";
import { getCookieConsent, setCookieConsent } from "@/lib/client/game-cookies";
import { Button } from "@/components/ui/button";

const SESSION_UI_DISMISSED = "nym_cookie_consent_ui_dismissed";
const SHOW_DELAY_MS = 2000;

/** Survives React remounts even when sessionStorage / localStorage are blocked. */
let dismissedInMemory = false;

function readUiDismissed(): boolean {
  if (dismissedInMemory) return true;
  try {
    if (sessionStorage.getItem(SESSION_UI_DISMISSED) === "1") {
      dismissedInMemory = true;
      return true;
    }
  } catch {
    // ignore
  }
  try {
    if (localStorage.getItem(SESSION_UI_DISMISSED) === "1") {
      dismissedInMemory = true;
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function writeUiDismissed() {
  dismissedInMemory = true;
  try {
    sessionStorage.setItem(SESSION_UI_DISMISSED, "1");
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(SESSION_UI_DISMISSED, "1");
  } catch {
    // ignore
  }
}

export function CookieConsentPopup() {
  const [mounted, setMounted] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const consent = getCookieConsent();
    const needsConsent = consent === "unset" && !readUiDismissed();
    setShouldShow(needsConsent);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!shouldShow) return;
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shouldShow]);

  const dismiss = useCallback(() => {
    writeUiDismissed();
    setVisible(false);
    setTimeout(() => setShouldShow(false), 300);
  }, []);

  const handleConsent = useCallback((value: "granted" | "denied") => {
    writeUiDismissed();
    setVisible(false);
    setTimeout(() => setShouldShow(false), 300);
    try {
      setCookieConsent(value);
    } catch {
      // ignore
    }
  }, []);

  if (!mounted || !shouldShow) return null;

  return createPortal(
    <div
      ref={rootRef}
      id="nym-cookie-consent-banner"
      className={`fixed bottom-4 left-4 right-4 z-[110000] mx-auto max-w-md rounded-xl border bg-card p-4 shadow-lg transition-all duration-300 ease-out sm:left-auto sm:right-6 sm:bottom-6 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
      style={{
        paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
      }}
      role="dialog"
      aria-label="Cookie consent"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2.5 right-2.5 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Cookie className="size-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Cookie preferences</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We use cookies to save your games on this device.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => handleConsent("granted")}
        >
          Allow cookies
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleConsent("denied")}
        >
          Decline
        </Button>
      </div>
    </div>,
    document.body
  );
}
