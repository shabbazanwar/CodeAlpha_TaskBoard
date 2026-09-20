import type { ProjectRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ProjectAccess = {
  projectId: string;
  role: ProjectRole;
};

/**
 * Every write in this app is gated on project membership, not merely on being
 * signed in. These helpers are the single place that check is made.
 *
 * A caller who is not a member is treated the same as a caller asking for a
 * project that does not exist — both get 404 — so that the API never reveals
 * which project IDs are real. 403 is reserved for a member whose *role* is too
 * low for the action (for example a MEMBER trying to invite someone).
 */
export async function getProjectAccess(
  projectId: string,
  userId: string
): Promise<ProjectAccess | null> {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { projectId: true, role: true },
  });

  return membership;
}

/** Resolves the board's project, then the caller's membership of it. */
export async function getBoardAccess(
  boardId: string,
  userId: string
): Promise<ProjectAccess | null> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { projectId: true },
  });

  if (!board) return null;
  return getProjectAccess(board.projectId, userId);
}

/** Resolves the task's board, then its project, then the caller's membership. */
export async function getTaskAccess(
  taskId: string,
  userId: string
): Promise<ProjectAccess | null> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { board: { select: { projectId: true } } },
  });

  if (!task) return null;
  return getProjectAccess(task.board.projectId, userId);
}

/** Only owners and admins may invite or remove members. */
export function canManageMembers(role: ProjectRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/** True when the given user is a member of the given project. */
export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  const count = await prisma.projectMember.count({
    where: { projectId, userId },
  });
  return count > 0;
}
