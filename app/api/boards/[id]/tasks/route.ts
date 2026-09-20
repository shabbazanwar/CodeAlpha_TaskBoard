import { NextResponse } from "next/server";
import { apiError, notFound, readJson, unauthorized, validationError } from "@/lib/api";
import { getBoardAccess, isProjectMember } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { taskSelect } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { createTaskSchema } from "@/lib/validation";

/** POST /api/boards/[id]/tasks — add a card to the bottom of a column. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await getBoardAccess(params.id, user.id);
  if (!access) return notFound("Board not found");

  const body = await readJson(request);
  if (body === null) return apiError("Request body must be JSON", 400);

  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { assigneeId } = parsed.data;

  // A task may only be assigned to someone who is on the project.
  if (assigneeId && !(await isProjectMember(access.projectId, assigneeId))) {
    return apiError("That person is not a member of this project", 422, {
      assigneeId: ["That person is not a member of this project"],
    });
  }

  const last = await prisma.task.findFirst({
    where: { boardId: params.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      priority: parsed.data.priority ?? "MEDIUM",
      dueDate: parsed.data.dueDate ?? null,
      assigneeId: assigneeId ?? null,
      createdById: user.id,
      boardId: params.id,
      position: last ? last.position + 1 : 0,
    },
    select: taskSelect,
  });

  return NextResponse.json(task, { status: 201 });
}
