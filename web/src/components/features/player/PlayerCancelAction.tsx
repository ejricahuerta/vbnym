"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelSignupForPlayer } from "@/server/actions/player-signup";

type PlayerCancelActionProps = {
  gameId: string;
  signupId: string;
  playerName: string;
  paymentStatus: "paid" | "pending" | "refund" | "canceled";
  className?: string;
  fullWidth?: boolean;
};

export function PlayerCancelAction({
  gameId,
  signupId,
  playerName,
  paymentStatus,
  className = "btn ghost sm",
  fullWidth = false,
}: PlayerCancelActionProps): JSX.Element {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function closeModal(): void {
    if (pending) return;
    setConfirmOpen(false);
    setCancelled(false);
    setError(null);
  }

  function submitCancel(): void {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("gameId", gameId);
      formData.set("signupId", signupId);
      const res = await cancelSignupForPlayer(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCancelled(true);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        className={className}
        style={fullWidth ? { width: "100%" } : undefined}
        onClick={() => {
          setCancelled(false);
          setError(null);
          setConfirmOpen(true);
        }}
      >
        Cancel
      </button>
      {confirmOpen ? (
        <div
          role="dialog"
          className="motion-fade-in"
          aria-modal
          aria-label="Cancel signup confirmation"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(17,17,20,.55)",
            zIndex: 60,
            display: "grid",
            placeItems: "center",
            padding: 18,
          }}
          onClick={closeModal}
        >
          <div className="card motion-sheet-panel" style={{ width: "min(480px, 100%)", padding: 18 }} onClick={(e) => e.stopPropagation()}>
            <div className="label" style={{ marginBottom: 8 }}>
              Player portal
            </div>
            {cancelled ? (
              <>
                <h3 className="display" style={{ fontSize: "clamp(22px, 4vw, 30px)", margin: "0 0 10px" }}>
                  Spot cancelled
                </h3>
                <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.45 }}>
                  <strong>{playerName}</strong> has been removed from this game.
                </p>
                <p style={{ margin: "10px 0 0", color: "var(--ink-2)", fontSize: 14, lineHeight: 1.45 }}>
                  {paymentStatus === "paid"
                    ? "What to expect: your host now sees this as a refund cancellation and will process the refund."
                    : "What to expect: this is now marked as canceled before payment confirmation."}
                </p>
                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="btn sm accent" onClick={closeModal}>
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="display" style={{ fontSize: "clamp(22px, 4vw, 30px)", margin: "0 0 10px" }}>
                  Cancel your spot?
                </h3>
                <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.45 }}>
                  This removes <strong>{playerName}</strong> from this game.
                </p>
                {error ? (
                  <p role="alert" style={{ margin: "10px 0 0", color: "var(--warn)", fontSize: 13, fontWeight: 600 }}>
                    {error}
                  </p>
                ) : null}
                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="btn sm ghost" onClick={closeModal} disabled={pending}>
                    Back
                  </button>
                  <button type="button" className="btn sm accent" onClick={submitCancel} disabled={pending} aria-busy={pending}>
                    {pending ? "Cancelling..." : "Yes, cancel"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
