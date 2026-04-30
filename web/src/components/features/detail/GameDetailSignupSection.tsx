"use client";

import { useCallback, useEffect, useState } from "react";

import { SignupForm } from "@/components/features/detail/SignupForm";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { GameKind } from "@/types/domain";

const DETAIL_WIDE = "(min-width: 920px)";
const MODAL_EXIT_MS = 360;

export type GameDetailSignupSectionProps = {
  gameId: string;
  priceCents: number;
  signedCount: number;
  capacity: number;
  hostName: string;
  hostEmail: string;
  gameTitle: string;
  startsAtDisplay: string;
  kind: GameKind;
};

export function GameDetailSignupSection(props: GameDetailSignupSectionProps): JSX.Element {
  const { gameId, priceCents, signedCount, capacity, hostName, hostEmail, gameTitle, startsAtDisplay, kind } = props;
  const [ready, setReady] = useState(false);
  const wide = useMediaQuery(DETAIL_WIDE);
  const [modalRendered, setModalRendered] = useState(false);
  const [modalEnter, setModalEnter] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const openModal = useCallback(() => {
    setModalEnter(false);
    setModalRendered(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalEnter(false);
  }, []);

  useEffect(() => {
    if (!modalRendered) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setModalEnter(true)));
    return () => cancelAnimationFrame(id);
  }, [modalRendered]);

  useEffect(() => {
    if (modalEnter) return;
    if (!modalRendered) return;
    const t = window.setTimeout(() => setModalRendered(false), MODAL_EXIT_MS);
    return () => window.clearTimeout(t);
  }, [modalEnter, modalRendered]);

  const spotsLeft = Math.max(capacity - signedCount, 0);
  const introLabel =
    spotsLeft <= 0 ? "Join wait-list" : kind === "dropin" ? "Sign me up" : "Register team";
  const priceWhole = Math.floor(priceCents / 100);

  useEffect(() => {
    if (!modalRendered) return;
    function onKey(e: KeyboardEvent): void {
      if (!modalEnter) return;
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [modalRendered, modalEnter, closeModal]);

  const signupModal = (
    <SignupForm
      gameId={gameId}
      priceCents={priceCents}
      signedCount={signedCount}
      capacity={capacity}
      hostName={hostName}
      hostEmail={hostEmail}
      gameTitle={gameTitle}
      startsAtDisplay={startsAtDisplay}
      kind={kind}
      initialStep="form"
      onDismissFromForm={closeModal}
      onHeaderClose={closeModal}
    />
  );

  const signupInline = (
    <SignupForm
      gameId={gameId}
      priceCents={priceCents}
      signedCount={signedCount}
      capacity={capacity}
      hostName={hostName}
      hostEmail={hostEmail}
      gameTitle={gameTitle}
      startsAtDisplay={startsAtDisplay}
      kind={kind}
    />
  );

  if (!ready) {
    return <div className="card thin" style={{ minHeight: 0, padding: 0 }} aria-hidden />;
  }

  if (wide) {
    return signupInline;
  }

  return (
    <>
      {!modalRendered ? (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            paddingLeft: 18,
            paddingRight: 18,
            paddingTop: 10,
            paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
            background: "var(--paper)",
            borderTop: "2px solid var(--ink)",
            boxShadow: "0 -10px 40px rgba(17, 17, 20, 0.14)",
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gap: 10 }}>
            <div
              className="card thin"
              style={{
                padding: "10px 12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 0,
              }}
            >
              <div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--ink-3)", fontWeight: 700 }}>
                  {kind === "dropin" ? "PER PLAYER" : "PER TEAM"}
                </div>
                <div className="display" style={{ fontSize: 22, lineHeight: 1.1, letterSpacing: "-.02em" }}>
                  ${priceWhole}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--ink-3)", fontWeight: 700 }}>
                  SPOTS LEFT
                </div>
                <div className="display" style={{ fontSize: 22, lineHeight: 1.1 }}>
                  {spotsLeft}
                </div>
              </div>
            </div>
            <button type="button" className="btn lg accent motion-press" style={{ width: "100%" }} onClick={openModal}>
              {introLabel} →
            </button>
          </div>
        </div>
      ) : null}
      {modalRendered ? (
        <div
          className="signup-modal-root"
          data-enter={modalEnter ? "true" : "false"}
          role="dialog"
          aria-modal="true"
          aria-label="Sign up for this game"
        >
          <div className="signup-modal-backdrop" onClick={closeModal} aria-hidden />
          <div className="signup-modal-panel" onClick={(e) => e.stopPropagation()}>
            {signupModal}
          </div>
        </div>
      ) : null}
    </>
  );
}
