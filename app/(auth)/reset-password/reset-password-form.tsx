"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError, api, jsonBody } from "@/lib/client";

type LinkState = "checking" | "valid" | "invalid";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";

  const [linkState, setLinkState] = useState<LinkState>(token ? "checking" : "invalid");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Find out up front whether the link is still usable.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    api<{ valid: boolean }>(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((result) => !cancelled && setLinkState(result.valid ? "valid" : "invalid"))
      .catch(() => !cancelled && setLinkState("valid")); // network hiccup: let them try

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await api("/api/auth/reset-password", { method: "POST", ...jsonBody({ token, password }) });
      setDone(true);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 400) setLinkState("invalid");
      else if (caught instanceof ApiError && caught.details?.password?.[0]) setError(caught.details.password[0]);
      else setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="animate-pop-in" role="status">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 5 5L20 7" />
          </svg>
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink-900">Password updated</h1>
        <p className="mt-2 text-sm text-ink-500">You can now sign in with your new password.</p>
        <Link href="/login" className="btn-primary mt-6 w-full py-2.5">
          Continue to sign in
        </Link>
      </div>
    );
  }

  if (linkState === "invalid") {
    return (
      <div className="animate-pop-in">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v5M12 17h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink-900">Link expired</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          This reset link is invalid, has already been used, or has expired. Request a fresh one and
          try again.
        </p>
        <Link href="/forgot-password" className="btn-primary mt-6 w-full py-2.5">
          Request a new link
        </Link>
        <p className="mt-6 text-center text-sm text-ink-500">
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Choose a new password</h1>
      <p className="mt-2 text-sm text-ink-500">Pick something at least 8 characters long.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {error ? (
          <p role="alert" className="alert-error">
            {error}
          </p>
        ) : null}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink-700">
            New password
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-ink-700">
            Confirm new password
          </label>
          <PasswordInput
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="mt-1.5"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || linkState === "checking"}
          className="btn-primary w-full py-2.5"
        >
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
