import type { CommentRow, ProjectBoard, TaskCard, TaskDetail } from "@/lib/queries";
import type {
  BoardData,
  CommentData,
  MemberData,
  ProjectBoardData,
  TaskCardData,
  TaskDetailData,
} from "@/lib/types";

/**
 * Prisma rows -> the client-facing shapes in lib/types.ts. Used by the API
 * routes and by server components, so both produce byte-identical JSON.
 */

export function serializeTask(task: TaskCard): TaskCardData {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    position: task.position,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    boardId: task.boardId,
    assignee: task.assignee,
    createdBy: task.createdBy,
    commentCount: task._count.comments,
  };
}

export function serializeComment(comment: CommentRow): CommentData {
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    author: comment.author,
  };
}

export function serializeTaskDetail(task: TaskDetail): TaskDetailData {
  return {
    ...serializeTask(task),
    comments: task.comments.map(serializeComment),
  };
}

export function serializeBoard(board: ProjectBoard["boards"][number]): BoardData {
  return {
    id: board.id,
    name: board.name,
    position: board.position,
    tasks: board.tasks.map(serializeTask),
  };
}

export function serializeMember(member: ProjectBoard["members"][number]): MemberData {
  return { id: member.id, role: member.role, user: member.user };
}

export function serializeProjectBoard(
  project: ProjectBoard,
  role: ProjectBoardData["role"]
): ProjectBoardData {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    ownerId: project.ownerId,
    role,
    members: project.members.map(serializeMember),
    boards: project.boards.map(serializeBoard),
  };
}
