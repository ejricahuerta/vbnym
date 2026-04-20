"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { verifyAdminLoginEmail } from "@/server/actions/verify-admin-login-email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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

type LoginStep = "email" | "google";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const callbackError = decodeCallbackError(searchParams.get("error"));
  const [step, setStep] = useState<LoginStep>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifyPending, startVerify] = useTransition();
  const [oauthPending, startOAuth] = useTransition();

  const displayError = error ?? callbackError;
  const emailOk = email.trim().toLowerCase().includes("@");

  function submitEmailCheck() {
    setError(null);
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) {
      setError("Enter the email you use for admin access.");
      return;
    }
    startVerify(async () => {
      const fd = new FormData();
      fd.set("email", normalized);
      const gate = await verifyAdminLoginEmail(fd);
      if (!gate.ok) {
        setError(gate.error);
        return;
      }
      setStep("google");
    });
  }

  function signInWithGoogle() {
    setError(null);
    const normalized = email.trim().toLowerCase();
    startOAuth(async () => {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { login_hint: normalized },
        },
      });
      if (oauthErr) {
        setError(oauthErr.message);
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
      } else {
        setError("Could not start Google sign-in.");
      }
    });
  }

  function goBackToEmail() {
    setError(null);
    setStep("email");
  }

  if (step === "google") {
    return (
      <div className="flex flex-col gap-4">
        {displayError ? (
          <p className="text-sm text-destructive">{displayError}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{email.trim().toLowerCase()}</span> is
          allowed. Continue with Google using that account.
        </p>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11 w-full gap-2 rounded-xl border-2"
          disabled={oauthPending}
          onClick={signInWithGoogle}
        >
          {oauthPending ? (
            <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
          ) : (
            <GoogleMark />
          )}
          {oauthPending ? "Redirecting…" : "Continue with Google"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto rounded-xl text-muted-foreground"
          disabled={oauthPending}
          onClick={goBackToEmail}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {displayError ? (
        <p className="text-sm text-destructive">{displayError}</p>
      ) : null}
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submitEmailCheck();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="admin-login-email">Admin email</Label>
          <Input
            id="admin-login-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="you@ednsy.com"
            className={cn("rounded-xl bg-muted/50")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-11 w-full gap-2 rounded-xl"
          disabled={verifyPending || !emailOk}
        >
          {verifyPending ? (
            <>
              <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
              Checking…
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>
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
