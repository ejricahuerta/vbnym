import { describe, expect, it } from "vitest";

import { registerCaptainTeamFormSchema } from "@/types/schemas/league-form";

describe("registerCaptainTeamFormSchema", () => {
  it("parses roster emails from comma and newline separated input", () => {
    const parsed = registerCaptainTeamFormSchema.safeParse({
      seasonId: "00000000-0000-4000-8000-000000000001",
      divisionId: "00000000-0000-4000-8000-000000000002",
      teamName: "Spikers",
      captainName: "Alex",
      captainEmail: "alex@example.com",
      rosterEmails: "a@example.com, b@example.com\na@example.com",
      termsAccepted: true,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.rosterEmails).toEqual(["a@example.com", "b@example.com"]);
    }
  });

  it("rejects when terms not accepted", () => {
    const parsed = registerCaptainTeamFormSchema.safeParse({
      seasonId: "00000000-0000-4000-8000-000000000001",
      divisionId: "00000000-0000-4000-8000-000000000002",
      teamName: "Spikers",
      captainName: "Alex",
      captainEmail: "alex@example.com",
      rosterEmails: "",
      termsAccepted: false,
    });
    expect(parsed.success).toBe(false);
  });
});
