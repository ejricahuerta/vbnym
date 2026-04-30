import { z } from "zod";

import type { ActionResult } from "@/types/action-result";

export const hostSetSignupPaymentStatusSchema = z.object({
  gameId: z.string().uuid(),
  signupId: z.string().uuid(),
  paymentStatus: z.enum(["paid", "pending", "refund", "canceled"]),
});

export type HostSetSignupPaymentStatusInput = z.infer<typeof hostSetSignupPaymentStatusSchema>;

export const hostSetSignupRosterStatusSchema = z.object({
  gameId: z.string().uuid(),
  signupId: z.string().uuid(),
  status: z.enum(["active", "waitlist", "removed", "deleted"]),
});

export type HostSetSignupRosterStatusInput = z.infer<typeof hostSetSignupRosterStatusSchema>;

function f(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === "string" ? value : "";
}

export function parseHostSetSignupPaymentStatusFormData(
  formData: FormData
): ActionResult<HostSetSignupPaymentStatusInput> {
  const parsed = hostSetSignupPaymentStatusSchema.safeParse({
    gameId: f(formData, "gameId"),
    signupId: f(formData, "signupId"),
    paymentStatus: f(formData, "paymentStatus"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payment update." };
  }
  return { ok: true, data: parsed.data };
}

export function parseHostSetSignupRosterStatusFormData(formData: FormData): ActionResult<HostSetSignupRosterStatusInput> {
  const parsed = hostSetSignupRosterStatusSchema.safeParse({
    gameId: f(formData, "gameId"),
    signupId: f(formData, "signupId"),
    status: f(formData, "status"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid roster update." };
  }
  return { ok: true, data: parsed.data };
}
