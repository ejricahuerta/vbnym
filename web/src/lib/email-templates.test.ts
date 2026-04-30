import { describe, expect, it } from "vitest";

import {
  buildHostSignupNotificationEmailTemplate,
  buildPlayerSignupPaymentEmailTemplate,
} from "@/lib/email-templates";

describe("signup email templates", () => {
  it("includes grouped signup metadata in player payment template", () => {
    const template = buildPlayerSignupPaymentEmailTemplate({
      gameTitle: "Tuesday Run",
      startsAtDisplay: "Tue, Apr 30, 8:00 PM",
      gameOrganizerName: "6ixBack",
      playerOrganizationName: "6ixBack",
      hostName: "Host One",
      hostEmail: "host@example.com",
      playerName: "Edmel",
      paymentCode: "ABC123",
      amountCents: 4500,
      playerCount: 3,
      addedByName: "Edmel",
      refundOwnerName: "Edmel",
      deadlineMinutes: 30,
      manualOnly: false,
    });

    expect(template.text).toContain("Players: 3");
    expect(template.text).toContain("Added by: Edmel");
    expect(template.text).toContain("Refund owner: Edmel");
  });

  it("includes grouped signup metadata in host notification template", () => {
    const template = buildHostSignupNotificationEmailTemplate({
      gameTitle: "Tuesday Run",
      startsAtDisplay: "Tue, Apr 30, 8:00 PM",
      gameOrganizerName: "6ixBack",
      playerOrganizationName: "6ixBack",
      playerName: "Edmel",
      playerEmail: "edmel@example.com",
      paymentCode: "ABC123",
      amountCents: 4500,
      playerCount: 3,
      addedByName: "Edmel",
      refundOwnerName: "Edmel",
      manualOnly: true,
    });

    expect(template.text).toContain("Players: 3");
    expect(template.text).toContain("Added by: Edmel");
    expect(template.text).toContain("Refund owner: Edmel");
  });
});
