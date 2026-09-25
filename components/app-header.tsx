"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import type { UserSummary } from "@/lib/types";

export function AppHeader({ user }: { user: UserSummary }) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-100/80 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[100rem] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <Link href="/projects" aria-label="TaskBoard home" className="rounded-lg">
          <Logo />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2.5 rounded-full border border-ink-100 bg-white/80 py-1 pl-1 pr-3.5 shadow-soft sm:flex">
            <Avatar user={user} size="sm" />
            <span className="text-sm font-medium text-ink-700">{user.name}</span>
          </div>
          <span className="sm:hidden">
            <Avatar user={user} size="md" />
          </span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="btn-ghost btn-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
