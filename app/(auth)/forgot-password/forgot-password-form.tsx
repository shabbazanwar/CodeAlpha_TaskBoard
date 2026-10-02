"use client";

import { useState, type FormEvent } from "react";
import { ApiError, api, jsonBody } from "@/lib/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api("/api/auth/forgot-password", { method: "POST", ...jsonBody({ email }) });
      setSentTo(email.trim());
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.details?.email?.[0]
          ? caught.details.email[0]
          : caught instanceof ApiError
            ? caught.message
            : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // The same message shows whether or not the address has an account.
  if (sentTo) {
    return (
      <div className="mt-8 animate-pop-in rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="status">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </span>
        <h2 className="mt-3 text-base font-semibold text-ink-900">Check your inbox</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">
          If an account exists for <span className="font-medium text-ink-800">{sentTo}</span>, a
          reset link is on its way. It expires in 1 hour. Don&apos;t forget to check your spam folder.
        </p>
        <button type="button" onClick={() => setSentTo(null)} className="btn-ghost btn-sm mt-3">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {error ? (
        <p role="alert" className="alert-error">
          {error}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input mt-1.5"
        />
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5">
        {submitting ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
