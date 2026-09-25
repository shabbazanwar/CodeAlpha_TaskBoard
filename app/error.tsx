"use client";

import { useEffect } from "react";
import { Logo } from "@/components/ui/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo />
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 8v5M12 17h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Something went wrong</h1>
      <p className="max-w-md text-sm leading-relaxed text-ink-500">
        An unexpected error occurred. Try again, and if it keeps happening, reload the page.
      </p>
      <button type="button" onClick={reset} className="btn-primary px-5 py-2.5">
        Try again
      </button>
    </main>
  );
}
