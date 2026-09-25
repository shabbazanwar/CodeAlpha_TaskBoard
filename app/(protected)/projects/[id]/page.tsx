import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BoardView } from "@/components/board/board-view";
import { getProjectAccess } from "@/lib/authz";
import { getProjectBoard } from "@/lib/queries";
import { serializeProjectBoard } from "@/lib/serialize";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const user = await getCurrentUser();
  if (!user) return { title: "TaskBoard" };

  const access = await getProjectAccess(params.id, user.id);
  if (!access) return { title: "Not found · TaskBoard" };

  const project = await getProjectBoard(params.id);
  return { title: project ? `${project.name} · TaskBoard` : "TaskBoard" };
}

export default async function ProjectBoardPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Non-members get the 404 page, same as a project that does not exist.
  const access = await getProjectAccess(params.id, user.id);
  if (!access) notFound();

  const project = await getProjectBoard(params.id);
  if (!project) notFound();

  return <BoardView project={serializeProjectBoard(project, access.role)} currentUserId={user.id} />;
}
