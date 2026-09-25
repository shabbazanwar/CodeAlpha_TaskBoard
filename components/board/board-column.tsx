"use client";

import { useState, type FormEvent } from "react";
import { TaskCard } from "@/components/board/task-card";
import type { BoardData } from "@/lib/types";

export function BoardColumn({
  board,
  boards,
  onOpenTask,
  onMoveTask,
  onCreateTask,
  onRenameBoard,
}: {
  board: BoardData;
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
    <section className="flex w-72 shrink-0 flex-col rounded-lg bg-slate-100 p-3">
      <header className="flex items-center justify-between gap-2">
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
              className="w-full rounded border border-indigo-300 px-2 py-1 text-sm font-medium outline-none"
              aria-label="Column name"
            />
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setRenaming(true)}
            title="Click to rename"
            className="flex-1 truncate text-left text-sm font-semibold text-slate-700"
          >
            {board.name}
          </button>
        )}
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
          {board.tasks.length}
        </span>
      </header>

      <div className="mt-3 flex flex-col gap-2">
        {board.tasks.length === 0 && !adding ? (
          <p className="rounded-md border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500">
            Nothing here yet.
          </p>
        ) : null}

        {board.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            boards={boards}
            onOpen={() => onOpenTask(task.id)}
            onMove={(toBoardId) => onMoveTask(task.id, toBoardId)}
          />
        ))}
      </div>

      {adding ? (
        <form onSubmit={handleAdd} className="mt-2">
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
            }}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
            aria-label={`New task in ${board.name}`}
          />
          <div className="mt-1.5 flex gap-2">
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Adding…" : "Add task"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setTitle("");
              }}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-200"
        >
          + Add task
        </button>
      )}
    </section>
  );
}
