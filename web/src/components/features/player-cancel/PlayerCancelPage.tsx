import Link from "next/link";

type CancelStatus = "done" | "invalid" | "not-found" | "not-eligible" | "too-late" | "failed";

function messageForStatus(status: CancelStatus): { title: string; body: string } {
  if (status === "done") {
    return {
      title: "Signup cancelled",
      body: "Your signup has been cancelled. The host will refund your payment as soon as possible.",
    };
  }
  if (status === "too-late") {
    return {
      title: "Cancellation window closed",
      body: "This link is no longer valid because cancellation closes 2 hours before game start.",
    };
  }
  if (status === "not-eligible") {
    return {
      title: "Cancellation unavailable",
      body: "This signup cannot be cancelled from this link.",
    };
  }
  if (status === "failed") {
    return {
      title: "Could not cancel signup",
      body: "Something went wrong while processing your request. Please contact your host.",
    };
  }
  if (status === "not-found") {
    return {
      title: "Signup not found",
      body: "This cancellation link does not match an active signup.",
    };
  }
  return {
    title: "Invalid cancellation link",
    body: "This cancellation link is invalid or expired.",
  };
}

export function PlayerCancelPage({ status }: { status: CancelStatus }) {
  const message = messageForStatus(status);
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 18 }}>
      <section className="card" style={{ width: "100%", maxWidth: 640, border: "2px solid var(--ink)", padding: 24 }}>
        <p className="label" style={{ margin: 0 }}>
          6IX BACK
        </p>
        <h1 className="display" style={{ margin: "12px 0 10px", fontSize: "clamp(30px, 6vw, 48px)", letterSpacing: "-.02em" }}>
          {message.title}
        </h1>
        <p style={{ margin: "0 0 18px", color: "var(--ink-2)", fontSize: 16, lineHeight: 1.5 }}>{message.body}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/browse" className="button-primary">
            Back to browse
          </Link>
          <Link href="/login" className="button-secondary">
            Player sign-in
          </Link>
        </div>
      </section>
    </main>
  );
}
