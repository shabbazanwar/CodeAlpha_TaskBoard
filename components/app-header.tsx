"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { UserSummary } from "@/lib/types";

export function AppHeader({ user }: { user: UserSummary }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/projects" className="text-sm font-semibold text-slate-900">
          TaskBoard
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">{user.name}</span>
          <Avatar user={user} size="sm" />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
