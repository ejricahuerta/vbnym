"use client";

import { useState } from "react";
import { CancellationPolicyDialog } from "@/components/games/cancellation-policy-dialog";

const linkClassName =
  "block w-full text-left text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground bg-transparent border-0 p-0 font-inherit cursor-pointer";

export function FooterPoliciesModalTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={linkClassName} onClick={() => setOpen(true)}>
        Refunds & cancellations
      </button>
      <CancellationPolicyDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
