import { NextResponse } from "next/server";
import { apiError, notFound, readJson, unauthorized, validationError } from "@/lib/api";
import { getProjectAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { createBoardSchema } from "@/lib/validation";

/** POST /api/projects/[id]/boards — add a column to the right of the others. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await getProjectAccess(params.id, user.id);
  if (!access) return notFound("Project not found");

  const body = await readJson(request);
  if (body === null) return apiError("Request body must be JSON", 400);

  const parsed = createBoardSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const last = await prisma.board.findFirst({
    where: { projectId: params.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const board = await prisma.board.create({
    data: {
      name: parsed.data.name,
      position: last ? last.position + 1 : 0,
      projectId: params.id,
    },
    select: { id: true, name: true, position: true, projectId: true },
  });

  return NextResponse.json({ ...board, tasks: [] }, { status: 201 });
}
