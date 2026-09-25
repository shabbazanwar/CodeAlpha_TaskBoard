import { NextResponse } from "next/server";
import { apiError, notFound, readJson, unauthorized, validationError } from "@/lib/api";
import { getBoardAccess } from "@/lib/authz";
import { insertAt } from "@/lib/ordering";
import { prisma } from "@/lib/prisma";
import { broadcast } from "@/lib/realtime";
import { getCurrentUser } from "@/lib/session";
import { updateBoardSchema } from "@/lib/validation";

/** PATCH /api/boards/[id] — rename a column or move it left/right. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await getBoardAccess(params.id, user.id);
  if (!access) return notFound("Board not found");

  const body = await readJson(request);
  if (body === null) return apiError("Request body must be JSON", 400);

  const parsed = updateBoardSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { name, position } = parsed.data;

  const board = await prisma.$transaction(async (tx) => {
    if (name !== undefined) {
      await tx.board.update({ where: { id: params.id }, data: { name } });
    }

    if (position !== undefined) {
      const siblings = await tx.board.findMany({
        where: { projectId: access.projectId, id: { not: params.id } },
        orderBy: { position: "asc" },
        select: { id: true },
      });

      const order = insertAt(siblings, params.id, position);
      await Promise.all(
        order.map((id, index) => tx.board.update({ where: { id }, data: { position: index } }))
      );
    }

    return tx.board.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, position: true, projectId: true },
    });
  });

  if (board) {
    await broadcast(access.projectId, {
      event: "board:upsert",
      payload: {
        actorId: user.id,
        board: { id: board.id, name: board.name, position: board.position },
      },
    });
  }

  return NextResponse.json(board);
}
