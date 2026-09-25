"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { ErrorBlock, LoadingBlock } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { ApiError, api, jsonBody } from "@/lib/client";
import type {
  BoardData,
  CommentData,
  MemberData,
  TaskCardData,
  TaskDetailData,
  TaskPriorityName,
} from "@/lib/types";

const PRIORITIES: TaskPriorityName[] = ["LOW", "MEDIUM", "HIGH"];

/** yyyy-mm-dd for <input type="date">, or "" when there is no due date. */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export function TaskDetail({
  taskId,
  boards,
  members,
  onClose,
  onTaskChanged,
  onTaskDeleted,
  onCommentAdded,
}: {
  taskId: string;
  boards: BoardData[];
  members: MemberData[];
  onClose: () => void;
  onTaskChanged: (task: TaskCardData) => void;
  onTaskDeleted: (taskId: string) => void;
  onCommentAdded: (taskId: string) => void;
}) {
  const [task, setTask] = useState<TaskDetailData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setTask(null);
    try {
      setTask(await api<TaskDetailData>(`/api/tasks/${taskId}`));
    } catch (caught) {
      setLoadError(caught instanceof ApiError ? caught.message : "Could not load this task.");
    }
  }, [taskId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(changes: Record<string, unknown>) {
    if (!task) return;
    setSaving(true);
    setSaveError(null);

    try {
      const updated = await api<TaskCardData>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        ...jsonBody(changes),
      });
      setTask({ ...task, ...updated });
      onTaskChanged(updated);
    } catch (caught) {
      setSaveError(caught instanceof ApiError ? caught.message : "Could not save that change.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;

    setSaving(true);
    try {
      await api<void>(`/api/tasks/${task.id}`, { method: "DELETE" });
      onTaskDeleted(task.id);
      onClose();
    } catch (caught) {
      setSaveError(caught instanceof ApiError ? caught.message : "Could not delete this task.");
      setSaving(false);
    }
  }

  async function handleComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task || !comment.trim()) return;

    setPostingComment(true);
    setSaveError(null);

    try {
      const created = await api<CommentData>(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        ...jsonBody({ body: comment.trim() }),
      });
      setTask({
        ...task,
        comments: [...task.comments, created],
        commentCount: task.commentCount + 1,
      });
      setComment("");
      onCommentAdded(task.id);
    } catch (caught) {
      setSaveError(caught instanceof ApiError ? caught.message : "Could not post that comment.");
    } finally {
      setPostingComment(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={task?.title ?? "Task"}>
      {loadError ? (
        <div className="p-6">
          <ErrorBlock message={loadError} onRetry={load} />
          <div className="mt-4 flex justify-end">
            <CloseButton onClose={onClose} />
          </div>
        </div>
      ) : !task ? (
        <LoadingBlock label="Loading task…" />
      ) : (
        <div className="max-h-[80vh] overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-4">
            <input
              value={task.title}
              maxLength={200}
              aria-label="Task title"
              onChange={(event) => setTask({ ...task, title: event.target.value })}
              onBlur={(event) => {
                const value = event.target.value.trim();
                if (value && value !== task.title) void patch({ title: value });
              }}
              className="-ml-2 w-full rounded px-2 py-1 text-lg font-semibold text-slate-900 outline-none hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-400"
            />
            <CloseButton onClose={onClose} />
          </div>

          {saveError ? (
            <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </p>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Labelled label="Column">
              <select
                value={task.boardId}
                onChange={(event) => void patch({ boardId: event.target.value })}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
              >
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
            </Labelled>

            <Labelled label="Assignee">
              <select
                value={task.assignee?.id ?? ""}
                onChange={(event) =>
                  void patch({ assigneeId: event.target.value ? event.target.value : null })
                }
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </Labelled>

            <Labelled label="Priority">
              <select
                value={task.priority}
                onChange={(event) => void patch({ priority: event.target.value })}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0) + priority.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </Labelled>

            <Labelled label="Due date">
              <input
                type="date"
                value={toDateInput(task.dueDate)}
                onChange={(event) =>
                  void patch({ dueDate: event.target.value ? event.target.value : null })
                }
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
            </Labelled>
          </div>

          <div className="mt-5">
            <label
              htmlFor="task-description"
              className="block text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Description
            </label>
            <textarea
              id="task-description"
              rows={4}
              maxLength={5000}
              value={task.description ?? ""}
              placeholder="Add more detail…"
              onChange={(event) => setTask({ ...task, description: event.target.value })}
              onBlur={(event) => {
                const value = event.target.value.trim();
                if (value !== (task.description ?? "")) void patch({ description: value || null });
              }}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>

          <section className="mt-6">
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Comments ({task.comments.length})
            </h3>

            {task.comments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No comments yet.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {task.comments.map((entry) => (
                  <li key={entry.id} className="flex gap-2">
                    <Avatar user={entry.author} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{entry.author.name}</span>{" "}
                        {new Date(entry.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm text-slate-800">
                        {entry.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleComment} className="mt-3">
              <textarea
                rows={2}
                value={comment}
                maxLength={5000}
                placeholder="Write a comment…"
                aria-label="Write a comment"
                onChange={(event) => setComment(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={postingComment || !comment.trim()}
                className="mt-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {postingComment ? "Posting…" : "Comment"}
              </button>
            </form>
          </section>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-400">
              {task.createdBy ? `Created by ${task.createdBy.name}` : "Created by a removed user"}
              {saving ? " · Saving…" : ""}
            </p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              Delete task
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="shrink-0 rounded-md px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
    >
      ✕
    </button>
  );
}
