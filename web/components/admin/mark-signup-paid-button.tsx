"use client";

import { setSignupPaid } from "@/server/actions/admin-signups";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

type Props = {
  signupId: string;
  paid: boolean;
  label: string;
};

export function MarkSignupPaidButton({ signupId, paid, label }: Props) {
  return (
    <form action={setSignupPaid}>
      <input type="hidden" name="id" value={signupId} />
      <input type="hidden" name="paid" value={paid ? "false" : "true"} />
      <FormSubmitButton
        type="submit"
        variant="outline"
        size="sm"
        className="w-full md:w-auto"
      >
        {label}
      </FormSubmitButton>
    </form>
  );
}
