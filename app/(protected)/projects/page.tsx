import Link from "next/link";
import { redirect } from "next/navigation";
import { NewProjectButton } from "@/components/projects/new-project-button";
import { AvatarStack } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/feedback";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Projects · TaskBoard" };
export const dynamic = "force-dynamic";

/** A stable accent per project, so each card is recognisable at a glance. */
const ACCENTS = [
  "from-indigo-500 via-violet-500 to-fuchsia-500",
  "from-sky-500 via-cyan-500 to-teal-400",
  "from-emerald-500 via-teal-500 to-cyan-400",
  "from-blue-600 via-blue-500 to-cyan-400",
  "from-amber-500 via-orange-400 to-rose-400",
  "from-slate-700 via-blue-600 to-sky-400",
];

function accentFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return ACCENTS[sum % ACCENTS.length];
}

const ROLE_STYLES: Record<string, string> = {
  OWNER: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-100",
  MEMBER: "bg-ink-50 text-ink-600 ring-ink-100",
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: user.id } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      members: {
        orderBy: { createdAt: "asc" },
        select: { userId: true, role: true, user: { select: { id: true, name: true, email: true } } },
      },
      boards: { select: { _count: { select: { tasks: true } } } },
    },
  });

  const firstName = user.name.trim().split(/\s+/)[0] || "there";

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">{greeting()},</p>
          <h1 className="mt-0.5 text-3xl font-semibold tracking-tight text-ink-900">
            {firstName} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            {projects.length === 0
              ? "Projects you create or are invited to appear here."
              : `You're part of ${projects.length} project${projects.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        {projects.length > 0 ? <NewProjectButton /> : null}
      </div>

      {projects.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No projects yet"
            description="Create your first project to start organising work into boards and tasks."
            action={<NewProjectButton />}
          />
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => {
            const role = project.members.find((member) => member.userId === user.id)?.role ?? "MEMBER";
            const taskCount = project.boards.reduce((sum, board) => sum + board._count.tasks, 0);

            return (
              <li
                key={project.id}
                className="animate-rise-in"
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              >
                <Link
                  href={`/projects/${project.id}`}
                  className="card group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className={`relative h-20 bg-gradient-to-br ${accentFor(project.id)}`}>
                    <div className="bg-dots absolute inset-0 opacity-40 invert" />
                    <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/25 text-base font-semibold text-white ring-1 ring-white/40 backdrop-blur">
                      {project.name.charAt(0).toUpperCase()}
                    </span>
                    <span
                      className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${ROLE_STYLES[role]}`}
                    >
                      {role}
                    </span>
                  </div>

                  <div className="flex grow flex-col p-5">
                    <h2 className="truncate text-base font-semibold text-ink-900 transition group-hover:text-indigo-600">
                      {project.name}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 grow text-sm leading-relaxed text-ink-500">
                      {project.description || "No description yet."}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
                      <AvatarStack users={project.members.map((member) => member.user)} max={4} size="sm" />
                      <span className="text-xs font-medium text-ink-500">
                        {taskCount} task{taskCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
