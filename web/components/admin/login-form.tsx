"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function decodeCallbackError(code: string | null): string | null {
  if (!code) return null;
  if (code === "missing_code") {
    return "Sign-in was cancelled or incomplete.";
  }
  if (code === "server_config") {
    return "Server is not configured for authentication.";
  }
  try {
    return decodeURIComponent(code);
  } catch {
    return code;
  }
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const callbackError = decodeCallbackError(searchParams.get("error"));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const displayError = error ?? callbackError;

  async function signInWithGoogle() {
    setError(null);
    setPending(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    setPending(false);
    if (oauthErr) {
      setError(oauthErr.message);
      return;
    }
    if (data.url) {
      window.location.assign(data.url);
    } else {
      setError("Could not start Google sign-in.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {displayError ? (
        <p className="text-sm text-destructive">{displayError}</p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-11 w-full gap-2 rounded-xl border-2"
        disabled={pending}
        onClick={signInWithGoogle}
      >
        {pending ? (
          <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
        ) : (
          <GoogleMark />
        )}
        {pending ? "Redirecting…" : "Continue with Google"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Enable the Google provider in Supabase (Authentication → Providers) and
        add this redirect URL:{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[0.65rem]">
          …/auth/callback
        </code>
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
