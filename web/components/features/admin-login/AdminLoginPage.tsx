import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/components/admin/login-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[78vh] w-full max-w-md flex-col justify-center px-4 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-6 sm:pt-10">
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Admin login</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in with Google to manage games and signups.
        </p>
        <Suspense
          fallback={
            <div className="mt-6 flex flex-col gap-4">
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          }
        >
          <div className="mt-6">
            <LoginForm />
          </div>
        </Suspense>
        <Button variant="link" asChild className="mt-5 h-auto p-0 text-muted-foreground">
          <Link href="/">Back to site</Link>
        </Button>
      </div>
    </div>
  );
}
