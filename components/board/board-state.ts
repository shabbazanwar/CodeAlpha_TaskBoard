import { clampIndex } from "@/lib/ordering";
import type { BoardData, TaskCardData } from "@/lib/types";

/**
 * Pure helpers for the board's local state.
 *
 * They mirror what the API does on the server — insert at an index, then
 * renumber the affected columns from 0 — so an optimistic update and the
 * server's answer agree without a refetch. Phase 6 reuses them to apply
 * incoming socket events.
 */

const renumber = (tasks: TaskCardData[]): TaskCardData[] =>
  tasks.map((task, position) => ({ ...task, position }));

export function findTask(boards: BoardData[], taskId: string): TaskCardData | undefined {
  for (const board of boards) {
    const task = board.tasks.find((candidate) => candidate.id === taskId);
    if (task) return task;
  }
  return undefined;
}

/** Move a task to `toIndex` of `toBoardId`, renumbering both columns. */
export function moveTaskLocal(
  boards: BoardData[],
  taskId: string,
  toBoardId: string,
  toIndex: number
): BoardData[] {
  const moving = findTask(boards, taskId);
  if (!moving) return boards;

  const withoutTask = boards.map((board) => ({
    ...board,
    tasks: board.tasks.filter((task) => task.id !== taskId),
  }));

  return withoutTask.map((board) => {
    if (board.id !== toBoardId) return { ...board, tasks: renumber(board.tasks) };

    const tasks = [...board.tasks];
    tasks.splice(clampIndex(toIndex, tasks.length), 0, { ...moving, boardId: toBoardId });
    return { ...board, tasks: renumber(tasks) };
  });
}

/**
 * Insert or replace a task. If its `boardId` changed, it is removed from the
 * old column first and appended to the new one at its stated position.
 */
export function upsertTaskLocal(boards: BoardData[], task: TaskCardData): BoardData[] {
  const existing = findTask(boards, task.id);

  if (existing && existing.boardId === task.boardId) {
    return boards.map((board) =>
      board.id === task.boardId
        ? {
            ...board,
            tasks: board.tasks
              .map((candidate) => (candidate.id === task.id ? task : candidate))
              .sort((a, b) => a.position - b.position),
          }
        : board
    );
  }

  const withoutTask = boards.map((board) => ({
    ...board,
    tasks: board.tasks.filter((candidate) => candidate.id !== task.id),
  }));

  return withoutTask.map((board) => {
    if (board.id !== task.boardId) return { ...board, tasks: renumber(board.tasks) };

    const tasks = [...board.tasks];
    tasks.splice(clampIndex(task.position, tasks.length), 0, task);
    return { ...board, tasks: renumber(tasks) };
  });
}

export function removeTaskLocal(boards: BoardData[], taskId: string): BoardData[] {
  return boards.map((board) => {
    if (!board.tasks.some((task) => task.id === taskId)) return board;
    return { ...board, tasks: renumber(board.tasks.filter((task) => task.id !== taskId)) };
  });
}

/** Patch a few fields of a task in place, without touching its position. */
export function patchTaskLocal(
  boards: BoardData[],
  taskId: string,
  patch: Partial<TaskCardData>
): BoardData[] {
  return boards.map((board) => ({
    ...board,
    tasks: board.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
  }));
}

/**
 * Apply a task change made by someone else. An existing task is moved to its
 * stated column/position first (so siblings shift exactly as they did on the
 * server), then its other fields are overwritten.
 */
export function applyRemoteTask(boards: BoardData[], task: TaskCardData): BoardData[] {
  if (!findTask(boards, task.id)) return upsertTaskLocal(boards, task);

  const moved = moveTaskLocal(boards, task.id, task.boardId, task.position);
  return patchTaskLocal(moved, task.id, { ...task, position: findTask(moved, task.id)?.position ?? task.position });
}

/** Add or rename a column and put it at its stated position. */
export function upsertBoardLocal(
  boards: BoardData[],
  board: Pick<BoardData, "id" | "name" | "position">
): BoardData[] {
  const existing = boards.find((candidate) => candidate.id === board.id);
  const others = boards.filter((candidate) => candidate.id !== board.id);
  const next: BoardData = existing
    ? { ...existing, name: board.name }
    : { id: board.id, name: board.name, position: board.position, tasks: [] };

  others.splice(clampIndex(board.position, others.length), 0, next);
  return others.map((candidate, position) => ({ ...candidate, position }));
}
