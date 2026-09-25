import Link from "next/link";

/**
 * Also what a non-member sees for someone else's project: the API and pages
 * answer "not found" rather than "forbidden" so project IDs are not confirmed.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">404</p>
      <h1 className="text-2xl font-semibold text-slate-900">We couldn&apos;t find that page</h1>
      <p className="max-w-md text-sm text-slate-600">
        It may not exist, or you may not be a member of that project. Ask the project owner
        to invite you if you expected to see it.
      </p>
      <Link
        href="/projects"
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Back to projects
      </Link>
    </main>
  );
}
