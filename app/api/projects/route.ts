import { NextResponse } from "next/server";
import { apiError, readJson, unauthorized, validationError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { createProjectSchema } from "@/lib/validation";

/** A new project starts with the three columns people expect on a board. */
const DEFAULT_BOARDS = ["To Do", "In Progress", "Done"];

/** GET /api/projects — every project the caller owns or is a member of. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: user.id } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true, email: true } },
      members: {
        where: { userId: user.id },
        select: { role: true },
      },
      _count: { select: { members: true, boards: true } },
    },
  });

  return NextResponse.json(
    projects.map(({ members, _count, updatedAt, ...project }) => ({
      ...project,
      // The caller's own role, flattened for convenience.
      role: members[0]?.role ?? "MEMBER",
      memberCount: _count.members,
      boardCount: _count.boards,
      updatedAt: updatedAt.toISOString(),
    }))
  );
}

/** POST /api/projects — create a project; the caller becomes its OWNER. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await readJson(request);
  if (body === null) return apiError("Request body must be JSON", 400);

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        ownerId: user.id,
      },
    });

    await tx.projectMember.create({
      data: { projectId: created.id, userId: user.id, role: "OWNER" },
    });

    await tx.board.createMany({
      data: DEFAULT_BOARDS.map((name, position) => ({
        name,
        position,
        projectId: created.id,
      })),
    });

    return created;
  });

  return NextResponse.json(project, { status: 201 });
}
