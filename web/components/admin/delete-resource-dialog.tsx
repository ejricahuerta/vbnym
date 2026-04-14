"use client";

import { useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

type Props = {
  action: (formData: FormData) => Promise<void>;
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <form action={action} className="contents">
              {Object.entries(hiddenFields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))}
              <FormSubmitButton type="submit" variant="destructive" pendingLabel="Deleting…">
                Delete
              </FormSubmitButton>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
