"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { SubmitSpinner } from "@/components/ui/submit-spinner";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type FormSubmitButtonProps = ComponentProps<typeof Button> & {
  /** Shown while the form action is running (defaults to the same as `children`). */
  pendingLabel?: string;
};

export function FormSubmitButton({
  children,
  pendingLabel,
  className,
  disabled,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const busy = pending || disabled;

  return (
    <Button
      {...props}
      className={cn(pending && "gap-2", className)}
      disabled={busy}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <SubmitSpinner />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
