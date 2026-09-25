"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar } from "@/components/ui/avatar";
import type { BoardData, TaskCardData } from "@/lib/types";

const PRIORITY: Record<TaskCardData["priority"], { chip: string; bar: string; label: string }> = {
  LOW: { chip: "bg-sky-50 text-sky-700 ring-sky-100", bar: "bg-sky-400", label: "Low" },
  MEDIUM: { chip: "bg-amber-50 text-amber-700 ring-amber-100", bar: "bg-amber-400", label: "Medium" },
  HIGH: { chip: "bg-rose-50 text-rose-700 ring-rose-100", bar: "bg-rose-500", label: "High" },
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

/** Static card body; also rendered inside the drag overlay. */
export function TaskCardBody({
  task,
  boards,
  onOpen,
  onMove,
}: {
  task: TaskCardData;
  boards: BoardData[];
  onOpen?: () => void;
  onMove?: (toBoardId: string) => void;
}) {
  const due = task.dueDate ? formatDueDate(task.dueDate) : null;

  const priority = PRIORITY[task.priority];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-ink-100 bg-white p-3.5 pl-4 shadow-card transition duration-150 hover:border-indigo-200 hover:shadow-lift">
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${priority.bar}`} />

      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left text-[13.5px] font-medium leading-snug text-ink-900 transition hover:text-indigo-600"
      >
        {task.title}
      </button>

      {task.description ? (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-400">{task.description}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${priority.chip}`}
        >
          {priority.label}
        </span>

        {due ? (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
              due.overdue ? "bg-rose-50 text-rose-600" : "bg-ink-50 text-ink-500"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="5" width="18" height="16" rx="3" />
              <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
            </svg>
            {due.label}
          </span>
        ) : null}

        {task.commentCount > 0 ? (
          <span
            className="inline-flex items-center gap-1 text-[11px] text-ink-400"
            title={`${task.commentCount} comments`}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 5h16v11H9l-5 4z" strokeLinejoin="round" />
            </svg>
            {task.commentCount}
          </span>
        ) : null}

        <span className="ml-auto">
          {task.assignee ? (
            <Avatar user={task.assignee} size="sm" />
          ) : (
            <span
              title="Unassigned"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-ink-200 text-ink-300"
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </span>
      </div>

      {/* Keyboard/screen-reader friendly alternative to dragging. Tucked away
          until hover or keyboard focus. On touch screens tasks move by long-press
          drag, or through the Column picker in the task modal. */}
      <label className="block max-h-0 overflow-hidden opacity-0 transition-all duration-150 focus-within:mt-3 focus-within:max-h-10 focus-within:opacity-100 group-hover:mt-3 group-hover:max-h-10 group-hover:opacity-100">
        <span className="sr-only">Move {task.title} to another column</span>
        <select
          value={task.boardId}
          onChange={(event) => onMove?.(event.target.value)}
          className="input input-sm py-1 text-xs"
        >
          {boards.map((board) => (
            <option key={board.id} value={board.id}>
              {board.id === task.boardId ? board.name : `Move to ${board.name}`}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function TaskCard(props: {
  task: TaskCardData;
  boards: BoardData[];
  onOpen: () => void;
  onMove: (toBoardId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task.id,
    data: { type: "task", boardId: props.task.boardId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-30" : undefined}
      {...attributes}
      {...listeners}
    >
      <TaskCardBody {...props} />
    </div>
  );
}
