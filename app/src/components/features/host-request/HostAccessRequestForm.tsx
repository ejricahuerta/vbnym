"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { submitHostAccessRequest } from "@/server/actions/submit-host-access-request";

export function HostAccessRequestForm() {
  const searchParams = useSearchParams();
  const qpEmail = searchParams.get("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof qpEmail === "string" && qpEmail.includes("@")) {
      setEmail(qpEmail.trim().toLowerCase());
    }
  }, [qpEmail]);

  function submit(): void {
    setStatus(null);
    const fd = new FormData();
    fd.set("email", email.trim().toLowerCase());
    fd.set("name", name.trim());
    fd.set("message", message.trim());
    startTransition(async () => {
      const res = await submitHostAccessRequest(fd);
      if (!res.ok) {
        setStatus(res.error);
        return;
      }
      if (res.data.alreadyHost) {
        setStatus("That email is already approved. You can use host sign-in.");
        return;
      }
      if (res.data.duplicate) {
        setStatus("We already have a pending request for that email.");
        return;
      }
      setStatus("Thanks. We will review your request.");
      setName("");
      setMessage("");
    });
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!pending && email.includes("@") && name.trim().length > 0) submit();
      }}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div>
        <label className="label" htmlFor="host-req-email" style={{ display: "block", marginBottom: 8 }}>
          Email
        </label>
        <input
          id="host-req-email"
          name="email"
          className="input"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box" }}
        />
      </div>
      <div>
        <label className="label" htmlFor="host-req-name" style={{ display: "block", marginBottom: 8 }}>
          Your name
        </label>
        <input
          id="host-req-name"
          name="name"
          className="input"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box" }}
        />
      </div>
      <div>
        <label className="label" htmlFor="host-req-msg" style={{ display: "block", marginBottom: 8 }}>
          Message (optional)
        </label>
        <textarea
          id="host-req-msg"
          name="message"
          className="input"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 88 }}
        />
      </div>
      <button type="submit" className="btn accent" disabled={pending || !email.includes("@") || !name.trim()} aria-busy={pending} style={{ width: "100%" }}>
        {pending ? "Sending…" : "Submit request"}
      </button>
      <div aria-live="polite" aria-atomic="true">
        {status ? (
          <p style={{ margin: 0, fontSize: 14 }} role={status.startsWith("Thanks") ? "status" : "alert"}>
            {status}
          </p>
        ) : null}
      </div>
    </form>
  );
}
