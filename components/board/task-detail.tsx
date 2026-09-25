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
  initialTask,
  boards,
  members,
  onClose,
  onTaskChanged,
  onTaskDeleted,
  onCommentAdded,
}: {
  taskId: string;
  /** What the board already knows, so the modal can open instantly. */
  initialTask?: TaskCardData;
  boards: BoardData[];
  members: MemberData[];
  onClose: () => void;
  onTaskChanged: (task: TaskCardData) => void;
  onTaskDeleted: (taskId: string) => void;
  onCommentAdded: (taskId: string) => void;
}) {
  const [task, setTask] = useState<TaskDetailData | null>(
    initialTask ? { ...initialTask, comments: [] } : null
  );
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setCommentsLoading(true);
    try {
      const loaded = await api<TaskDetailData>(`/api/tasks/${taskId}`);
      // If the modal opened from the board's data, keep any edits made while this
      // was in flight and take only the comments from the server.
      setTask((current) =>
        current ? { ...current, comments: loaded.comments, commentCount: loaded.commentCount } : loaded
      );
      setCommentsLoading(false);
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
    <Modal open onClose={onClose} title={task?.title ?? "Task"} size="lg">
      {loadError && !task ? (
        <div className="p-6">
          <ErrorBlock message={loadError} onRetry={load} />
          <div className="mt-4 flex justify-end">
            <CloseButton onClose={onClose} />
          </div>
        </div>
      ) : !task ? (
        <LoadingBlock label="Loading task…" />
      ) : (
        <div className="max-h-[82vh] overflow-y-auto p-6 sm:p-8">
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
              className="-ml-2.5 w-full rounded-xl px-2.5 py-1.5 text-2xl font-semibold tracking-tight text-ink-900 outline-none transition hover:bg-ink-50 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
            />
            <CloseButton onClose={onClose} />
          </div>

          {saveError ? (
            <p role="alert" className="mt-3 alert-error">
              {saveError}
            </p>
          ) : null}

          <div className="mt-5 grid gap-4 rounded-2xl bg-ink-50/70 p-4 sm:grid-cols-2">
            <Labelled label="Column">
              <select
                value={task.boardId}
                onChange={(event) => void patch({ boardId: event.target.value })}
                className="input input-sm"
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
                className="input input-sm"
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
                className="input input-sm"
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
                className="input input-sm"
              />
            </Labelled>
          </div>

          <div className="mt-5">
            <label
              htmlFor="task-description"
              className="label"
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
              className="input mt-1.5"
            />
          </div>

          <section className="mt-6">
            <h3 className="label flex items-center gap-2">
              Comments
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-600">
                {commentsLoading ? task.commentCount : task.comments.length}
              </span>
            </h3>

            {commentsLoading && !loadError ? (
              <div className="mt-3 space-y-3" aria-busy="true" aria-label="Loading comments">
                {Array.from({ length: Math.min(Math.max(task.commentCount, 1), 3) }, (_, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-ink-100" />
                    <div className="h-12 flex-1 animate-pulse rounded-2xl bg-ink-50" />
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <div className="mt-3">
                <ErrorBlock message={loadError} onRetry={load} />
              </div>
            ) : task.comments.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-ink-200 px-4 py-5 text-center text-sm text-ink-400">
                No comments yet. Start the conversation below.
              </p>
            ) : (
              <ul className="mt-3 space-y-4">
                {task.comments.map((entry) => (
                  <li key={entry.id} className="flex gap-3">
                    <Avatar user={entry.author} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-ink-400">
                        <span className="text-sm font-semibold text-ink-800">{entry.author.name}</span>{" "}
                        · {new Date(entry.createdAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words rounded-2xl rounded-tl-md bg-ink-50 px-3.5 py-2.5 text-sm leading-relaxed text-ink-800">
                        {entry.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleComment} className="mt-4">
              <textarea
                rows={2}
                value={comment}
                maxLength={5000}
                placeholder="Write a comment…"
                aria-label="Write a comment"
                onChange={(event) => setComment(event.target.value)}
                className="input"
              />
              <button
                type="submit"
                disabled={postingComment || !comment.trim()}
                className="mt-2 btn-primary btn-sm"
              >
                {postingComment ? "Posting…" : "Comment"}
              </button>
            </form>
          </section>

          <div className="mt-8 flex items-center justify-between border-t border-ink-100 pt-4">
            <p className="text-xs text-ink-400">
              {task.createdBy ? `Created by ${task.createdBy.name}` : "Created by a removed user"}
              {saving ? " · Saving…" : ""}
            </p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="btn-danger btn-sm"
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
      <span className="label">{label}</span>
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
      className="shrink-0 rounded-xl p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6">
        <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
      </svg>
    </button>
  );
}
