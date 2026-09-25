import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { getCurrentUser } from "@/lib/session";

/**
 * Middleware already redirects unauthenticated visitors, but every page under
 * here needs the user object anyway — and checking again means a missing or
 * stale session can never render a protected page.
 */
export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader user={user} />
      {children}
    </div>
  );
}
