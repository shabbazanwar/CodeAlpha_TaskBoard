import { NextResponse } from "next/server";
import { notFound, unauthorized } from "@/lib/api";
import { getProjectAccess } from "@/lib/authz";
import { getProjectBoard } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";

/**
 * GET /api/projects/[id] — the full board view. Members only; non-members get
 * 404 rather than 403 so the API does not confirm that the project exists.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await getProjectAccess(params.id, user.id);
  if (!access) return notFound("Project not found");

  const project = await getProjectBoard(params.id);
  if (!project) return notFound("Project not found");

  return NextResponse.json({ ...project, role: access.role });
}
