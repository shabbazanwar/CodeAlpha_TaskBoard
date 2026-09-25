"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState, type FormEvent } from "react";
import { TaskCard } from "@/components/board/task-card";
import type { BoardData } from "@/lib/types";

export const columnDropId = (boardId: string) => `column:${boardId}`;

/** Status colour for a column, inferred from its name (else by position). */
function toneFor(name: string, index: number): { dot: string; bar: string; count: string } {
  const key = name.trim().toLowerCase();
  if (/(done|complete|shipped|closed)/.test(key))
    return { dot: "bg-emerald-500", bar: "from-emerald-400 to-teal-400", count: "bg-emerald-50 text-emerald-700" };
  if (/(progress|doing|active|working)/.test(key))
    return { dot: "bg-indigo-500", bar: "from-indigo-400 to-violet-400", count: "bg-indigo-50 text-indigo-700" };
  if (/(review|test|qa|blocked)/.test(key))
    return { dot: "bg-amber-500", bar: "from-amber-400 to-orange-400", count: "bg-amber-50 text-amber-700" };
  if (/(to ?do|backlog|new|idea)/.test(key))
    return { dot: "bg-ink-400", bar: "from-ink-300 to-ink-400", count: "bg-ink-100 text-ink-600" };

  const cycle = [
    { dot: "bg-sky-500", bar: "from-sky-400 to-cyan-400", count: "bg-sky-50 text-sky-700" },
    { dot: "bg-cyan-500", bar: "from-cyan-400 to-sky-400", count: "bg-cyan-50 text-cyan-700" },
    { dot: "bg-teal-500", bar: "from-teal-400 to-emerald-400", count: "bg-teal-50 text-teal-700" },
  ];
  return cycle[index % cycle.length];
}

export function BoardColumn({
  board,
  index,
  boards,
  onOpenTask,
  onMoveTask,
  onCreateTask,
  onRenameBoard,
}: {
  board: BoardData;
  index: number;
  boards: BoardData[];
  onOpenTask: (taskId: string) => void;
  onMoveTask: (taskId: string, toBoardId: string) => void;
  onCreateTask: (boardId: string, title: string) => Promise<void>;
  onRenameBoard: (boardId: string, name: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(board.name);
  const { setNodeRef, isOver } = useDroppable({
    id: columnDropId(board.id),
    data: { type: "column", boardId: board.id },
  });
  const tone = toneFor(board.name, index);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await onCreateTask(board.id, title.trim());
      setTitle("");
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  async function commitRename() {
    const trimmed = name.trim();
    setRenaming(false);

    if (!trimmed || trimmed === board.name) {
      setName(board.name);
      return;
    }

    await onRenameBoard(board.id, trimmed);
  }

  return (
    <section
      ref={setNodeRef}
      className={`flex w-[82vw] max-w-[19rem] shrink-0 snap-start flex-col rounded-2xl border p-3 transition-colors duration-150 ${
        isOver
          ? "border-indigo-300 bg-indigo-50/80 shadow-lift"
          : "border-white/70 bg-ink-100/60 backdrop-blur"
      }`}
    >
      <div aria-hidden className={`-mt-3 mb-3 h-1 rounded-b-full bg-gradient-to-r opacity-80 ${tone.bar}`} />

      <header className="flex items-center justify-between gap-2 px-1">
        {renaming ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void commitRename();
            }}
            className="flex-1"
          >
            <input
              autoFocus
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => void commitRename()}
              className="input input-sm py-1 font-semibold"
              aria-label="Column name"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setRenaming(true)}
            title="Click to rename"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left"
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
            <span className="truncate text-sm font-semibold text-ink-800">{board.name}</span>
          </button>
        )}
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.count}`}>
          {board.tasks.length}
        </span>
      </header>

      <div className="mt-3 flex min-h-[2.5rem] flex-col gap-2.5">
        {board.tasks.length === 0 && !adding ? (
          <p className="rounded-xl border border-dashed border-ink-200 bg-white/40 px-3 py-7 text-center text-xs text-ink-400">
            {isOver ? "Drop it here" : "No tasks yet"}
          </p>
        ) : null}

        <SortableContext
          items={board.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {board.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              boards={boards}
              onOpen={() => onOpenTask(task.id)}
              onMove={(toBoardId) => onMoveTask(task.id, toBoardId)}
            />
          ))}
        </SortableContext>
      </div>

      {adding ? (
        <form onSubmit={handleAdd} className="mt-2.5 animate-pop-in">
          <textarea
            autoFocus
            rows={2}
            value={title}
            maxLength={200}
            placeholder="What needs doing?"
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setAdding(false);
                setTitle("");
              }
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            className="input resize-none"
            aria-label={`New task in ${board.name}`}
          />
          <div className="mt-2 flex gap-2">
            <button type="submit" disabled={saving || !title.trim()} className="btn-primary btn-sm">
              {saving ? "Adding…" : "Add task"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setTitle("");
              }}
              className="btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2.5 flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-ink-500 transition hover:bg-white/80 hover:text-indigo-600"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add task
        </button>
      )}
    </section>
  );
}
