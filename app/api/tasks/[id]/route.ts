import { NextResponse } from "next/server";
import { apiError, notFound, readJson, unauthorized, validationError } from "@/lib/api";
import { getTaskAccess, isProjectMember } from "@/lib/authz";
import { insertAt } from "@/lib/ordering";
import { prisma } from "@/lib/prisma";
import { getTaskDetail, taskSelect } from "@/lib/queries";
import { serializeTask, serializeTaskDetail } from "@/lib/serialize";
import { getCurrentUser } from "@/lib/session";
import { updateTaskSchema } from "@/lib/validation";

/** GET /api/tasks/[id] — one task with its comment thread. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await getTaskAccess(params.id, user.id);
  if (!access) return notFound("Task not found");

  const task = await getTaskDetail(params.id);
  if (!task) return notFound("Task not found");

  return NextResponse.json(serializeTaskDetail(task));
}

/**
 * PATCH /api/tasks/[id] — edit fields, move to another column, (un)assign.
 *
 * Two checks matter here beyond plain membership:
 *  - a target board must belong to the *same* project, so a task can never be
 *    moved into a project the caller happens to also be a member of;
 *  - an assignee must be a member of this project.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await getTaskAccess(params.id, user.id);
  if (!access) return notFound("Task not found");

  const body = await readJson(request);
  if (body === null) return apiError("Request body must be JSON", 400);

  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.task.findUnique({
    where: { id: params.id },
    select: { boardId: true, position: true },
  });
  if (!existing) return notFound("Task not found");

  const { boardId, position, assigneeId, ...fields } = parsed.data;

  if (boardId !== undefined && boardId !== existing.boardId) {
    const targetBoard = await prisma.board.findUnique({
      where: { id: boardId },
      select: { projectId: true },
    });

    if (!targetBoard || targetBoard.projectId !== access.projectId) {
      return apiError("That board is not part of this project", 422, {
        boardId: ["That board is not part of this project"],
      });
    }
  }

  if (assigneeId && !(await isProjectMember(access.projectId, assigneeId))) {
    return apiError("That person is not a member of this project", 422, {
      assigneeId: ["That person is not a member of this project"],
    });
  }

  const targetBoardId = boardId ?? existing.boardId;
  const boardChanged = targetBoardId !== existing.boardId;

  const task = await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: params.id },
      data: {
        ...fields,
        ...(assigneeId !== undefined ? { assigneeId } : {}),
        ...(boardChanged ? { boardId: targetBoardId } : {}),
      },
    });

    if (boardChanged || position !== undefined) {
      const siblings = await tx.task.findMany({
        where: { boardId: targetBoardId, id: { not: params.id } },
        orderBy: { position: "asc" },
        select: { id: true },
      });

      // Default to the end of the column when only the board changed.
      const targetIndex = position ?? siblings.length;
      const order = insertAt(siblings, params.id, targetIndex);

      await Promise.all(
        order.map((id, index) => tx.task.update({ where: { id }, data: { position: index } }))
      );

      // Close the gap the task left behind in its old column.
      if (boardChanged) {
        const remaining = await tx.task.findMany({
          where: { boardId: existing.boardId },
          orderBy: { position: "asc" },
          select: { id: true },
        });

        await Promise.all(
          remaining.map(({ id }, index) =>
            tx.task.update({ where: { id }, data: { position: index } })
          )
        );
      }
    }

    return tx.task.findUnique({ where: { id: params.id }, select: taskSelect });
  });

  return NextResponse.json(task ? serializeTask(task) : null);
}

/** DELETE /api/tasks/[id] — remove a task and renumber the column. */
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await getTaskAccess(params.id, user.id);
  if (!access) return notFound("Task not found");

  const existing = await prisma.task.findUnique({
    where: { id: params.id },
    select: { boardId: true },
  });
  if (!existing) return notFound("Task not found");

  await prisma.$transaction(async (tx) => {
    await tx.task.delete({ where: { id: params.id } });

    const remaining = await tx.task.findMany({
      where: { boardId: existing.boardId },
      orderBy: { position: "asc" },
      select: { id: true },
    });

    await Promise.all(
      remaining.map(({ id }, index) => tx.task.update({ where: { id }, data: { position: index } }))
    );
  });

  return new NextResponse(null, { status: 204 });
}
