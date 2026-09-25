import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · TaskBoard" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-500">Sign in to pick up where you left off.</p>
      {/* LoginForm reads ?callbackUrl from the query string, so it needs a
          Suspense boundary to keep this page statically prerenderable. */}
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
      <p className="mt-8 text-center text-sm text-ink-500">
        New to TaskBoard?{" "}
        <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mt-8 space-y-5" aria-hidden>
      <div className="h-16 animate-pulse rounded-xl bg-ink-100" />
      <div className="h-16 animate-pulse rounded-xl bg-ink-100" />
      <div className="h-11 animate-pulse rounded-xl bg-ink-100" />
    </div>
  );
}
