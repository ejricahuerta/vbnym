import { SiteHeaderClient } from "@/components/SiteHeaderClient";
import { getAdminSessionEmail, getHostSessionEmail, getPlayerSessionEmail } from "@/lib/auth";

type HeaderNavItem = {
  href: string;
  label: string;
};

export async function SiteHeader() {
  const [hostSessionEmail, playerSessionEmail, adminSessionEmail] = await Promise.all([
    getHostSessionEmail(),
    getPlayerSessionEmail(),
    getAdminSessionEmail(),
  ]);

  const hostSignedIn = Boolean(hostSessionEmail);
  const playerSignedIn = Boolean(playerSessionEmail);
  const adminSignedIn = Boolean(adminSessionEmail);

  const items: HeaderNavItem[] = [];

  if (hostSignedIn) {
    items.push({ href: "/host", label: "Dashboard" });
  }

  if (playerSignedIn) {
    items.push({ href: "/player", label: "My games" });
  }

  if (adminSignedIn) {
    items.push({ href: "/admin", label: "Admin" });
  }

  const userMenu =
    hostSignedIn && hostSessionEmail
      ? {
          email: hostSessionEmail,
          role: "host" as const,
          dashboardHref: "/host",
          dashboardLabel: "Host dashboard",
        }
      : !hostSignedIn && adminSignedIn && adminSessionEmail
        ? {
            email: adminSessionEmail,
            role: "admin" as const,
            dashboardHref: "/admin",
            dashboardLabel: "Admin",
          }
        : playerSignedIn && playerSessionEmail
          ? {
              email: playerSessionEmail,
              role: "player" as const,
              dashboardHref: "/player",
              dashboardLabel: "My games",
            }
          : null;

  return (
    <SiteHeaderClient
      items={items}
      userMenu={userMenu}
      adminSessionEmail={adminSessionEmail}
    />
  );
}
