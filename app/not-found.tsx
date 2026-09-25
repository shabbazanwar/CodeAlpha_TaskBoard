import Link from "next/link";
import { Logo } from "@/components/ui/logo";

/**
 * Also what a non-member sees for someone else's project: the API and pages
 * answer "not found" rather than "forbidden" so project IDs are not confirmed.
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden px-6 text-center">
      <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(50%_50%_at_50%_45%,black,transparent)]" />
      <Logo className="relative" />
      <p className="gradient-text relative text-8xl font-semibold tracking-tighter sm:text-9xl">404</p>
      <h1 className="relative -mt-2 text-2xl font-semibold tracking-tight text-ink-900">
        We couldn&apos;t find that page
      </h1>
      <p className="relative max-w-md text-sm leading-relaxed text-ink-500">
        It may not exist, or you may not be a member of that project. Ask the project owner to
        invite you if you expected to see it.
      </p>
      <Link href="/projects" className="btn-primary relative px-5 py-2.5">
        Back to projects
      </Link>
    </main>
  );
}
