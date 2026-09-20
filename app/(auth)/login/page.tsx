import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · TaskBoard" };

export default function LoginPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Welcome back to TaskBoard.</p>
      {/* LoginForm reads ?callbackUrl from the query string, so it needs a
          Suspense boundary to keep this page statically prerenderable. */}
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mt-6 space-y-4" aria-hidden>
      <div className="h-14 rounded-md bg-slate-100" />
      <div className="h-14 rounded-md bg-slate-100" />
      <div className="h-9 rounded-md bg-slate-100" />
    </div>
  );
}
