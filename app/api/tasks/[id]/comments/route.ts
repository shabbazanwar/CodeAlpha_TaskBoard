import { NextResponse } from "next/server";
import { apiError, notFound, readJson, unauthorized, validationError } from "@/lib/api";
import { getTaskAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { commentSelect } from "@/lib/queries";
import { serializeComment } from "@/lib/serialize";
import { getCurrentUser } from "@/lib/session";
import { createCommentSchema } from "@/lib/validation";

/** POST /api/tasks/[id]/comments — add a comment to a task. Members only. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await getTaskAccess(params.id, user.id);
  if (!access) return notFound("Task not found");

  const body = await readJson(request);
  if (body === null) return apiError("Request body must be JSON", 400);

  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const comment = await prisma.comment.create({
    data: { body: parsed.data.body, taskId: params.id, authorId: user.id },
    select: commentSelect,
  });

  return NextResponse.json(serializeComment(comment), { status: 201 });
}
