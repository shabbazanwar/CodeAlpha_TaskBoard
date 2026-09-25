"use client";

import { Avatar } from "@/components/ui/avatar";
import type { BoardData, TaskCardData } from "@/lib/types";

const PRIORITY_STYLES: Record<TaskCardData["priority"], string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-rose-100 text-rose-700",
};

/** Formats a due date and flags it when it is today or in the past. */
export function formatDueDate(iso: string): { label: string; overdue: boolean } {
  const due = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  const label = due.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return { label, overdue: dueDay.getTime() <= today.getTime() };
}

export function TaskCard({
  task,
  boards,
  onOpen,
  onMove,
}: {
  task: TaskCardData;
  boards: BoardData[];
  onOpen: () => void;
  onMove: (toBoardId: string) => void;
}) {
  const due = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-300">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left text-sm font-medium text-slate-900 hover:text-indigo-700"
      >
        {task.title}
      </button>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[task.priority]}`}
        >
          {task.priority}
        </span>

        {due ? (
          <span className={due.overdue ? "font-medium text-rose-600" : "text-slate-500"}>
            {due.overdue ? "Due " : ""}
            {due.label}
          </span>
        ) : null}

        {task.commentCount > 0 ? (
          <span className="text-slate-500" title={`${task.commentCount} comments`}>
            💬 {task.commentCount}
          </span>
        ) : null}

        <span className="ml-auto">
          {task.assignee ? (
            <Avatar user={task.assignee} size="sm" />
          ) : (
            <span className="text-[10px] text-slate-400">Unassigned</span>
          )}
        </span>
      </div>

      {/* Keyboard//screen-reader friendly alternative to dragging. */}
      <label className="mt-2 block">
        <span className="sr-only">Move {task.title} to another column</span>
        <select
          value={task.boardId}
          onChange={(event) => onMove(event.target.value)}
          className="w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-xs text-slate-600 outline-none focus:border-indigo-400"
        >
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.id === task.boardId ? `In ${board.name}` : `Move to ${board.name}`}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
