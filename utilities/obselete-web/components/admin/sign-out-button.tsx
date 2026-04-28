"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { SubmitSpinner } from "@/components/ui/submit-spinner";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label="Log out"
      className={cn(
        "h-9 shrink-0 gap-1.5 px-2 text-sm font-medium sm:px-3",
        pending && "gap-2",
        className
      )}
      onClick={signOut}
      disabled={pending}
    >
      {pending ? (
        <SubmitSpinner className="size-4" />
      ) : (
        <LogOut className="size-4 shrink-0" aria-hidden />
      )}
      <span className="hidden sm:inline">{pending ? "Signing out…" : "Log out"}</span>
    </Button>
  );
}
