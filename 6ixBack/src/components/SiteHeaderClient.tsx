"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { SignOutForm } from "@/components/shared/SignOutForm";

type HeaderNavItem = {
  href: string;
  label: string;
};

type SiteHeaderUserMenu = {
  email: string;
  role: "host" | "player" | "admin";
  dashboardHref: string;
  dashboardLabel: string;
};

type SiteHeaderClientProps = {
  items: HeaderNavItem[];
  userMenu: SiteHeaderUserMenu | null;
  /** Present when admin session cookie is valid (including when `userMenu` is host so the bar can show Admin). */
  adminSessionEmail: string | null;
};

function IcoMenu({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IcoX({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function IcoArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoChevronDown({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/browse") {
    return pathname === "/browse" || pathname.startsWith("/games/");
  }
  if (href === "/player") {
    return pathname === "/player";
  }
  if (href === "/host") {
    return pathname === "/host" || pathname.startsWith("/host/");
  }
  if (href === "/host/login") {
    return pathname === "/host/login";
  }
  if (href === "/login") {
    return pathname === "/login";
  }
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/");
  }
  return pathname === href;
}

function UserMenuDesktop({
  userMenu,
  pathname,
}: {
  userMenu: SiteHeaderUserMenu;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = userMenu.email.trim().charAt(0).toUpperCase() || "?";
  const roleLabel =
    userMenu.role === "host" ? "HOST" : userMenu.role === "admin" ? "ADMIN" : "PLAYER";

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((o) => !o)}
        style={{
          appearance: "none",
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "2px solid var(--ink)",
          background: "var(--accent)",
          color: "var(--ink)",
          boxShadow: "2px 2px 0 var(--ink)",
          cursor: "pointer",
          fontFamily: "var(--display)",
          fontWeight: 900,
          fontSize: 15,
          lineHeight: 1,
          padding: 0,
          display: "inline-grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {initial}
      </button>
      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            minWidth: 260,
            zIndex: 60,
            padding: "14px 14px 12px",
            border: "2px solid var(--ink)",
            borderRadius: 8,
            background: "var(--paper)",
            boxShadow: "4px 4px 0 var(--ink)",
          }}
        >
          <div className="label" style={{ marginBottom: 6 }}>
            {roleLabel}
          </div>
          <div style={{ fontSize: 13, wordBreak: "break-all", marginBottom: 12, fontWeight: 600 }}>
            {userMenu.email}
          </div>
          <Link
            href={userMenu.dashboardHref}
            role="menuitem"
            className="btn sm ghost"
            style={{
              width: "100%",
              justifyContent: "center",
              marginBottom: 4,
              boxShadow: isNavActive(pathname, userMenu.dashboardHref)
                ? "2px 2px 0 var(--ink)"
                : undefined,
              background: isNavActive(pathname, userMenu.dashboardHref) ? "var(--accent)" : undefined,
            }}
            onClick={() => setOpen(false)}
          >
            {userMenu.dashboardLabel}
          </Link>
          <SignOutForm nextPath="/" compact />
        </div>
      ) : null}
    </div>
  );
}

function GuestSignInMenuDesktop({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const onLoginPath = pathname === "/login" || pathname === "/host/login";

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Sign in options"
        className="btn sm ghost"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          boxShadow: onLoginPath && !open ? "2px 2px 0 var(--ink)" : undefined,
          background: onLoginPath && !open ? "var(--accent)" : undefined,
        }}
      >
        Sign in
        <IcoChevronDown size={14} />
      </button>
      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            minWidth: 220,
            zIndex: 60,
            padding: "10px",
            border: "2px solid var(--ink)",
            borderRadius: 8,
            background: "var(--paper)",
            boxShadow: "4px 4px 0 var(--ink)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <Link
            href="/login"
            role="menuitem"
            className="btn sm ghost"
            style={{
              width: "100%",
              justifyContent: "center",
              boxShadow: pathname === "/login" ? "2px 2px 0 var(--ink)" : undefined,
              background: pathname === "/login" ? "var(--accent)" : undefined,
            }}
            onClick={() => setOpen(false)}
          >
            Player
          </Link>
          <Link
            href="/host/login"
            role="menuitem"
            className="btn sm ghost"
            style={{
              width: "100%",
              justifyContent: "center",
              boxShadow: pathname === "/host/login" ? "2px 2px 0 var(--ink)" : undefined,
              background: pathname === "/host/login" ? "var(--accent)" : undefined,
            }}
            onClick={() => setOpen(false)}
          >
            Host
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function HostEmailMenuDesktop({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Host account menu"
        className="btn sm ghost"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          maxWidth: 280,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={email}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
        <IcoChevronDown size={14} />
      </button>
      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            minWidth: 180,
            zIndex: 60,
            padding: "10px",
            border: "2px solid var(--ink)",
            borderRadius: 8,
            background: "var(--paper)",
            boxShadow: "4px 4px 0 var(--ink)",
          }}
        >
          <form action="/auth/logout" method="post" style={{ margin: 0 }}>
            <input type="hidden" name="next" value="/" />
            <button type="submit" className="btn sm ghost" style={{ width: "100%", justifyContent: "center" }}>
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function showFindGameCta(userMenu: SiteHeaderUserMenu | null): boolean {
  if (!userMenu) return true;
  return userMenu.role !== "host" && userMenu.role !== "admin";
}

export function SiteHeaderClient({
  items,
  userMenu,
  adminSessionEmail,
}: SiteHeaderClientProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu(): void {
    setMenuOpen(false);
  }

  return (
    <header style={{ borderBottom: "2px solid var(--ink)", background: "var(--bg)", position: "sticky", top: 0, zIndex: 50 }}>
      <div
        className="site-header-inner"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span className="display" style={{ fontSize: 22, letterSpacing: "-.01em", lineHeight: 1 }}>
            6IX BACK
          </span>
        </Link>

        <div
          className="site-header-desktop-only"
          style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 12 }}
        >
          {userMenu?.role !== "host" ? (
            <nav className="site-header-nav" aria-label="Primary">
              {items.map(({ href, label }) => (
                <Link key={href} href={href} className={`top-nav-pill ${isNavActive(pathname, href) ? "is-active" : ""}`}>
                  {label}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="site-header-actions">
            {userMenu?.role === "host" ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Link href={userMenu.dashboardHref} className={`top-nav-pill ${isNavActive(pathname, userMenu.dashboardHref) ? "is-active" : ""}`}>
                  Dashboard
                </Link>
                {adminSessionEmail ? (
                  <Link href="/admin" className={`top-nav-pill ${isNavActive(pathname, "/admin") ? "is-active" : ""}`}>
                    Admin
                  </Link>
                ) : null}
                <HostEmailMenuDesktop email={userMenu.email} />
              </div>
            ) : userMenu ? (
              <UserMenuDesktop key={pathname} userMenu={userMenu} pathname={pathname} />
            ) : (
              <GuestSignInMenuDesktop key={pathname} pathname={pathname} />
            )}
            {showFindGameCta(userMenu) ? (
              <Link href="/browse" className="btn sm accent">
                Find a game
              </Link>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="site-header-menu-btn site-header-mobile-only"
          aria-expanded={menuOpen}
          aria-controls="site-header-mobile-panel"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            appearance: "none",
            border: "2px solid var(--ink)",
            background: menuOpen ? "var(--ink)" : "var(--accent)",
            color: menuOpen ? "var(--accent)" : "var(--ink)",
            width: 42,
            height: 42,
            borderRadius: 6,
            cursor: "pointer",
            boxShadow: "2px 2px 0 var(--ink)",
            padding: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {menuOpen ? <IcoX size={20} /> : <IcoMenu size={20} />}
        </button>
      </div>

      {menuOpen ? (
        <div
          id="site-header-mobile-panel"
          className="site-header-mobile-drawer"
          style={{
            borderTop: "2px solid var(--ink)",
            background: "var(--paper)",
            padding: "14px 18px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={closeMenu}
                className="site-header-mobile-link"
                style={{
                  appearance: "none",
                  border: "2px solid var(--ink)",
                  padding: "12px 14px",
                  borderRadius: 6,
                  fontFamily: "var(--ui)",
                  fontWeight: 700,
                  fontSize: 14,
                  textAlign: "left",
                  background: isNavActive(pathname, href) ? "var(--ink)" : "var(--paper)",
                  color: isNavActive(pathname, href) ? "var(--paper)" : "var(--ink)",
                  textTransform: "uppercase",
                  letterSpacing: ".04em",
                  textDecoration: "none",
                  display: "block",
                }}
              >
                {label}
              </Link>
            ))}
            {userMenu?.role === "host" ? (
              <div
                style={{
                  border: "2px solid var(--ink)",
                  borderRadius: 6,
                  padding: "12px 14px",
                  marginTop: 4,
                  background: "var(--bg)",
                }}
              >
                <div className="label" style={{ marginBottom: 8 }}>
                  HOST
                </div>
                <div style={{ fontSize: 13, wordBreak: "break-all", fontWeight: 600, marginBottom: 12 }}>
                  {userMenu.email}
                </div>
                <form action="/auth/logout" method="post">
                  <input type="hidden" name="next" value="/" />
                  <button type="submit" className="btn sm ghost" style={{ width: "100%", justifyContent: "center", marginTop: 0 }}>
                    Sign out
                  </button>
                </form>
              </div>
            ) : userMenu ? (
              <div
                style={{
                  border: "2px solid var(--ink)",
                  borderRadius: 6,
                  padding: "12px 14px",
                  marginTop: 4,
                  background: "var(--bg)",
                }}
              >
                <div className="label" style={{ marginBottom: 8 }}>
                  {userMenu.role === "admin" ? "ADMIN" : "PLAYER"}
                </div>
                <div style={{ fontSize: 13, wordBreak: "break-all", fontWeight: 600, marginBottom: 12 }}>
                  {userMenu.email}
                </div>
                <SignOutForm nextPath="/" compact />
              </div>
            ) : (
              <div
                style={{
                  border: "2px solid var(--ink)",
                  borderRadius: 6,
                  padding: "12px 14px",
                  marginTop: 4,
                  background: "var(--bg)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div className="label" style={{ marginBottom: 2 }}>
                  Sign in
                </div>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="site-header-mobile-link"
                  style={{
                    appearance: "none",
                    border: "2px solid var(--ink)",
                    padding: "12px 14px",
                    borderRadius: 6,
                    fontFamily: "var(--ui)",
                    fontWeight: 700,
                    fontSize: 14,
                    textAlign: "left",
                    background: pathname === "/login" ? "var(--ink)" : "var(--paper)",
                    color: pathname === "/login" ? "var(--paper)" : "var(--ink)",
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  As player
                </Link>
                <Link
                  href="/host/login"
                  onClick={closeMenu}
                  className="site-header-mobile-link"
                  style={{
                    appearance: "none",
                    border: "2px solid var(--ink)",
                    padding: "12px 14px",
                    borderRadius: 6,
                    fontFamily: "var(--ui)",
                    fontWeight: 700,
                    fontSize: 14,
                    textAlign: "left",
                    background: pathname === "/host/login" ? "var(--ink)" : "var(--paper)",
                    color: pathname === "/host/login" ? "var(--paper)" : "var(--ink)",
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                    textDecoration: "none",
                    display: "block",
                  }}
                >
                  As host
                </Link>
              </div>
            )}
            {showFindGameCta(userMenu) ? (
              <Link href="/browse" className="btn lg accent" style={{ marginTop: 6, justifyContent: "center" }} onClick={closeMenu}>
                Find a game <IcoArrowRight size={16} />
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
