import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/projects");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6 text-center">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">TaskBoard</h1>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Organise work into projects and boards, assign tasks to your team and keep
          the conversation on the task itself.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/register"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
