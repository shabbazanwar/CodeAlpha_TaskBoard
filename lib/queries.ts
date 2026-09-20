import { prisma } from "@/lib/prisma";

/** Shape of a task as returned everywhere in the API and rendered on a card. */
export const taskSelect = {
  id: true,
  title: true,
  description: true,
  position: true,
  priority: true,
  dueDate: true,
  boardId: true,
  assigneeId: true,
  createdAt: true,
  updatedAt: true,
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { comments: true } },
} as const;

export const commentSelect = {
  id: true,
  body: true,
  createdAt: true,
  taskId: true,
  author: { select: { id: true, name: true, email: true } },
} as const;

/** The whole board view for a project: columns, their tasks, and the members. */
export async function getProjectBoard(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true, email: true } },
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
      boards: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          position: true,
          tasks: { orderBy: { position: "asc" }, select: taskSelect },
        },
      },
    },
  });
}

export type ProjectBoard = NonNullable<Awaited<ReturnType<typeof getProjectBoard>>>;
export type BoardWithTasks = ProjectBoard["boards"][number];
export type TaskCard = BoardWithTasks["tasks"][number];
export type ProjectMemberRow = ProjectBoard["members"][number];

/** A single task with its comment thread, for the task detail view. */
export async function getTaskDetail(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    select: {
      ...taskSelect,
      board: { select: { id: true, name: true, projectId: true } },
      comments: { orderBy: { createdAt: "asc" }, select: commentSelect },
    },
  });
}

export type TaskDetail = NonNullable<Awaited<ReturnType<typeof getTaskDetail>>>;
export type CommentRow = TaskDetail["comments"][number];
