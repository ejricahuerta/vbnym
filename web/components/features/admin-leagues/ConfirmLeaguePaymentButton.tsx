"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { confirmLeagueMemberPayment } from "@/server/actions/league-payments";

type Props = { paymentId: string };

export function ConfirmLeaguePaymentButton({ paymentId }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="rounded-lg"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const fd = new FormData();
          fd.set("payment_id", paymentId);
          await confirmLeagueMemberPayment(fd);
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Mark paid
    </Button>
  );
}
