"use client";

import { useState, type ComponentProps, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubmitSpinner } from "@/components/ui/submit-spinner";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types/action-result";

type Props = {
  action: (formData: FormData) => Promise<ActionResult<null>>;
  hiddenFields: Record<string, string>;
  /** Singular noun, lowercase in sentence (e.g. "game", "venue"). */
  resourceLabel: string;
  resourceTitle: string;
  triggerText?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  triggerSize?: ComponentProps<typeof Button>["size"];
  triggerClassName?: string;
};

export function DeleteResourceDialog({
  action,
  hiddenFields,
  resourceLabel,
  resourceTitle,
  triggerText = "Delete",
  triggerVariant = "destructive",
  triggerSize = "sm",
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await action(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {triggerText}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this {resourceLabel}?</DialogTitle>
            <DialogDescription>
              {`"${resourceTitle}" will be permanently removed. This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <form className="contents" onSubmit={onSubmit}>
              {Object.entries(hiddenFields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))}
              <Button
                type="submit"
                variant="destructive"
                disabled={pending}
                className={cn(pending && "gap-2")}
                aria-busy={pending}
              >
                {pending ? (
                  <>
                    <SubmitSpinner />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
