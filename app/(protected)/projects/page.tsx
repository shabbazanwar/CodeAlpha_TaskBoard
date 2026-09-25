import Link from "next/link";
import { redirect } from "next/navigation";
import { NewProjectButton } from "@/components/projects/new-project-button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/feedback";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const metadata = { title: "Projects · TaskBoard" };
export const dynamic = "force-dynamic";

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
      owner: { select: { id: true, name: true, email: true } },
      members: { where: { userId: user.id }, select: { role: true } },
      _count: { select: { members: true, boards: true } },
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            {projects.length === 0
              ? "Projects you create or are invited to appear here."
              : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {projects.length > 0 ? <NewProjectButton /> : null}
      </div>

      {projects.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No projects yet"
            description="Create your first project to start organising work into boards and tasks."
            action={<NewProjectButton />}
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-medium text-slate-900">{project.name}</h2>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    {project.members[0]?.role ?? "MEMBER"}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 grow text-sm text-slate-500">
                  {project.description || "No description."}
                </p>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Avatar user={project.owner} size="sm" />
                    {project.owner.name}
                  </span>
                  <span>
                    {project._count.members} member{project._count.members === 1 ? "" : "s"} ·{" "}
                    {project._count.boards} board{project._count.boards === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
