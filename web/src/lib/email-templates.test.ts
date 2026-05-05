import { describe, expect, it } from "vitest";

import {
  buildHostSignupNotificationEmailTemplate,
  buildHostWaitlistSignupNotificationEmailTemplate,
  buildPlayerSignupPaymentEmailTemplate,
  buildPlayerWaitlistJoinedEmailTemplate,
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

  it("waitlist player email tells them not to pay yet and includes invite window", () => {
    const template = buildPlayerWaitlistJoinedEmailTemplate({
      gameTitle: "Tuesday Run",
      startsAtDisplay: "Tue, Apr 30, 8:00 PM",
      gameOrganizerName: "6ixBack",
      playerOrganizationName: "6ixBack",
      hostName: "Host One",
      hostEmail: "host@example.com",
      playerName: "Edmel",
      playerCount: 2,
      addedByName: "Edmel",
      amountCents: 9000,
      paymentCode: "WL-ABC",
      waitlistInviteMinutes: 30,
    });

    expect(template.subject).toContain("Waitlist confirmed");
    expect(template.text).toContain("Do not send Interac until");
    expect(template.text).toContain("30 minutes");
    expect(template.text).toContain("WL-ABC");
    expect(template.text).toContain("Players: 2");
  });

  it("waitlist host notification distinguishes waitlist from active signup", () => {
    const template = buildHostWaitlistSignupNotificationEmailTemplate({
      gameTitle: "Tuesday Run",
      startsAtDisplay: "Tue, Apr 30, 8:00 PM",
      gameOrganizerName: "6ixBack",
      playerOrganizationName: "6ixBack",
      playerName: "Edmel",
      playerEmail: "edmel@example.com",
      paymentCode: "WL-ABC",
      amountCents: 4500,
      playerCount: 1,
      addedByName: "Edmel",
      refundOwnerName: "Edmel",
      manualOnly: false,
    });

    expect(template.subject).toContain("Waitlist signup");
    expect(template.text).toContain("on the waitlist");
    expect(template.text).toContain("Reserved reference: WL-ABC");
  });
});
