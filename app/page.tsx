import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { getCurrentUser } from "@/lib/session";

const FEATURES = [
  {
    title: "Boards that move",
    body: "Drag cards between columns, reorder within a column, and keep everything in the order you mean.",
    icon: "M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v5h-4z",
  },
  {
    title: "Live with your team",
    body: "Changes appear on everyone's screen the moment they happen. No refreshing, no stale boards.",
    icon: "M13 2 4 14h7l-1 8 9-12h-7z",
  },
  {
    title: "Talk on the task",
    body: "Assign owners, set due dates and priorities, and keep every conversation attached to the work.",
    icon: "M4 5h16v11H9l-5 4z",
  },
] as const;

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/projects");

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary">
            Get started
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto max-w-6xl px-6 pb-10 pt-14 text-center sm:pt-20">
        <span className="animate-rise-in inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-indigo-700 shadow-soft backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Real-time collaboration built in
        </span>

        <h1
          className="animate-rise-in mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink-900 sm:text-6xl"
          style={{ animationDelay: "60ms" }}
        >
          Plan work together, <span className="gradient-text">ship it faster</span>
        </h1>

        <p
          className="animate-rise-in mx-auto mt-5 max-w-xl text-balance text-base text-ink-500 sm:text-lg"
          style={{ animationDelay: "120ms" }}
        >
          Organise projects into boards, assign tasks to your team, and keep the conversation on
          the task itself, all in one calm workspace.
        </p>

        <div
          className="animate-rise-in mt-8 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "180ms" }}
        >
          <Link href="/register" className="btn-primary px-5 py-3 text-base">
            Create free account
          </Link>
          <Link href="/login" className="btn-secondary px-5 py-3 text-base">
            Sign in
          </Link>
        </div>
      </section>

      <BoardPreview />

      <section id="features" className="relative mx-auto grid max-w-6xl scroll-mt-8 gap-4 px-6 pb-20 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="card p-6 transition hover:-translate-y-1 hover:shadow-lift">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-glow">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d={feature.icon} />
              </svg>
            </span>
            <h3 className="mt-4 text-base font-semibold text-ink-900">{feature.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{feature.body}</p>
          </div>
        ))}
      </section>

      <SiteFooter />
    </main>
  );
}

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Get started", href: "/register" },
      { label: "Sign in", href: "/login" },
      { label: "Your projects", href: "/projects" },
    ],
  },
  {
    heading: "Features",
    links: [
      { label: "Kanban boards", href: "#features" },
      { label: "Live collaboration", href: "#features" },
      { label: "Task comments", href: "#features" },
    ],
  },
] as const;

function SiteFooter() {
  return (
    <footer className="relative border-t border-ink-100 bg-white/60 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
            A calm workspace for planning projects, assigning tasks and shipping together.
          </p>
        </div>

        {FOOTER_LINKS.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <h4 className="label">{group.heading}</h4>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-500 transition hover:text-indigo-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-ink-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-ink-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} TaskBoard. All rights reserved.</p>
          <p>
            Built with Next.js, Prisma &amp; Socket.io as part of the{" "}
            <span className="font-medium text-ink-500">CodeAlpha</span> internship.
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Decorative, non-interactive preview of what a board looks like. */
function BoardPreview() {
  const columns = [
    { name: "To Do", dot: "bg-slate-400", cards: [["Design onboarding flow", "HIGH", "from-rose-400 to-orange-400", "AK"], ["Write launch notes", "LOW", "from-sky-400 to-indigo-500", "MJ"]] },
    { name: "In Progress", dot: "bg-indigo-500", cards: [["Build realtime sync", "HIGH", "from-violet-400 to-fuchsia-500", "SR"], ["Fix mobile layout", "MEDIUM", "from-emerald-400 to-teal-500", "TL"]] },
    { name: "Done", dot: "bg-emerald-500", cards: [["Set up database", "MEDIUM", "from-amber-400 to-orange-500", "DP"]] },
  ] as const;

  const priority: Record<string, string> = {
    HIGH: "bg-rose-50 text-rose-600",
    MEDIUM: "bg-amber-50 text-amber-600",
    LOW: "bg-sky-50 text-sky-600",
  };

  return (
    <div className="animate-rise-in relative mx-auto max-w-4xl px-6 pb-16" style={{ animationDelay: "260ms" }} aria-hidden>
      <div className="absolute inset-x-10 -top-6 bottom-0 rounded-[2.5rem] bg-gradient-to-b from-indigo-300/30 via-violet-300/20 to-transparent blur-3xl" />
      <div className="relative rounded-3xl border border-white/80 bg-white/70 p-3 shadow-pop backdrop-blur-xl sm:p-4">
        <div className="mb-3 flex items-center gap-1.5 px-1">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {columns.map((column, index) => (
            <div key={column.name} className="rounded-2xl bg-ink-50/90 p-3">
              <div className="flex items-center gap-2 px-1 text-xs font-semibold text-ink-700">
                <span className={`h-2 w-2 rounded-full ${column.dot}`} />
                {column.name}
                <span className="ml-auto rounded-full bg-white px-1.5 py-0.5 text-[10px] text-ink-400">
                  {column.cards.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {column.cards.map(([title, level, gradient, initials], cardIndex) => (
                  <div
                    key={title}
                    className="animate-float rounded-xl border border-ink-100 bg-white p-3 text-left shadow-card"
                    style={{
                      animationDelay: `${index * 0.6 + cardIndex * 0.9}s`,
                      ["--r" as string]: cardIndex % 2 === 0 ? "-0.6deg" : "0.6deg",
                    }}
                  >
                    <p className="text-[13px] font-medium text-ink-900">{title}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${priority[level]}`}>
                        {level}
                      </span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br text-[8px] font-bold text-white ${gradient}`}>
                        {initials}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
