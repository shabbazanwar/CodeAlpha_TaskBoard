import { NextResponse } from "next/server";
import { apiError, forbidden, notFound, readJson, unauthorized, validationError } from "@/lib/api";
import { canManageMembers, getProjectAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { addMemberSchema } from "@/lib/validation";

/**
 * POST /api/projects/[id]/members — invite an existing user by email.
 * Owners and admins only; a plain MEMBER gets 403.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await getProjectAccess(params.id, user.id);
  if (!access) return notFound("Project not found");
  if (!canManageMembers(access.role)) {
    return forbidden("Only the project owner or an admin can add members");
  }

  const body = await readJson(request);
  if (body === null) return apiError("Request body must be JSON", 400);

  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const email = parsed.data.email.toLowerCase();
  const invitee = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (!invitee) {
    return apiError("No account with that email address", 404);
  }

  const alreadyMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.id, userId: invitee.id } },
    select: { id: true },
  });

  if (alreadyMember) {
    return apiError("That person is already a member of this project", 409);
  }

  const member = await prisma.projectMember.create({
    data: { projectId: params.id, userId: invitee.id, role: parsed.data.role },
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(member, { status: 201 });
}
