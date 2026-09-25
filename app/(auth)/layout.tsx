import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";

const POINTS = [
  "Drag-and-drop boards your whole team can see",
  "Live updates the moment anyone makes a change",
  "Comments, due dates and assignees on every task",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel — hidden on small screens, where the form takes the stage. */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-30 invert" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-fuchsia-300/20 blur-3xl" />

        <Link href="/" className="relative inline-flex w-fit items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
              <rect x="3" y="4" width="4.6" height="16" rx="1.6" />
              <rect x="9.7" y="4" width="4.6" height="10.5" rx="1.6" fillOpacity="0.8" />
              <rect x="16.4" y="4" width="4.6" height="6.5" rx="1.6" fillOpacity="0.6" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight">TaskBoard</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight">
            Your team&apos;s work, all in one calm place.
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[15px] text-white/90">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="white" strokeWidth="3.5">
                    <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/60">Built for teams who ship.</p>
      </aside>

      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm animate-rise-in">
          <Link href="/" className="mb-8 block w-fit lg:hidden">
            <Logo />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
