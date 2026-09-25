"use client";

import { useCallback, useState, type FormEvent } from "react";
import { BoardColumn } from "@/components/board/board-column";
import {
  findTask,
  moveTaskLocal,
  patchTaskLocal,
  removeTaskLocal,
  upsertTaskLocal,
} from "@/components/board/board-state";
import { InviteMember } from "@/components/board/invite-member";
import { TaskDetail } from "@/components/board/task-detail";
import { Avatar } from "@/components/ui/avatar";
import { ApiError, api, jsonBody } from "@/lib/client";
import type { BoardData, MemberData, ProjectBoardData, TaskCardData } from "@/lib/types";

export function BoardView({ project: initialProject }: { project: ProjectBoardData }) {
  const [project, setProject] = useState(initialProject);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addingBoard, setAddingBoard] = useState(false);
  const [boardName, setBoardName] = useState("");

  const setBoards = useCallback(
    (update: (boards: BoardData[]) => BoardData[]) =>
      setProject((current) => ({ ...current, boards: update(current.boards) })),
    []
  );

  const report = useCallback((caught: unknown, fallback: string) => {
    setError(caught instanceof ApiError ? caught.message : fallback);
  }, []);

  /* ------------------------------------------------------------- tasks --- */

  const createTask = useCallback(
    async (boardId: string, title: string) => {
      setError(null);
      try {
        const task = await api<TaskCardData>(`/api/boards/${boardId}/tasks`, {
          method: "POST",
          ...jsonBody({ title }),
        });
        setBoards((boards) => upsertTaskLocal(boards, task));
      } catch (caught) {
        report(caught, "Could not add that task.");
      }
    },
    [report, setBoards]
  );

  const moveTask = useCallback(
    async (taskId: string, toBoardId: string, toIndex?: number) => {
      setError(null);

      const previous = project.boards;
      const target = project.boards.find((board) => board.id === toBoardId);
      const current = findTask(previous, taskId);
      if (!target || !current || (current.boardId === toBoardId && toIndex === undefined)) return;

      const index = toIndex ?? target.tasks.length;

      // Optimistic: the server performs the same insert-and-renumber.
      setBoards((boards) => moveTaskLocal(boards, taskId, toBoardId, index));

      try {
        await api<TaskCardData>(`/api/tasks/${taskId}`, {
          method: "PATCH",
          ...jsonBody({ boardId: toBoardId, position: index }),
        });
      } catch (caught) {
        setBoards(() => previous);
        report(caught, "Could not move that task.");
      }
    },
    [project.boards, report, setBoards]
  );

  const handleTaskChanged = useCallback(
    (task: TaskCardData) => setBoards((boards) => upsertTaskLocal(boards, task)),
    [setBoards]
  );

  const handleTaskDeleted = useCallback(
    (taskId: string) => setBoards((boards) => removeTaskLocal(boards, taskId)),
    [setBoards]
  );

  const handleCommentAdded = useCallback(
    (taskId: string) =>
      setBoards((boards) => {
        const task = findTask(boards, taskId);
        if (!task) return boards;
        return patchTaskLocal(boards, taskId, { commentCount: task.commentCount + 1 });
      }),
    [setBoards]
  );

  /* ------------------------------------------------------------ boards --- */

  const renameBoard = useCallback(
    async (boardId: string, name: string) => {
      setError(null);
      const previous = project.boards;
      setBoards((boards) =>
        boards.map((board) => (board.id === boardId ? { ...board, name } : board))
      );

      try {
        await api(`/api/boards/${boardId}`, { method: "PATCH", ...jsonBody({ name }) });
      } catch (caught) {
        setBoards(() => previous);
        report(caught, "Could not rename that column.");
      }
    },
    [project.boards, report, setBoards]
  );

  async function handleAddBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = boardName.trim();
    if (!name) return;

    setError(null);
    try {
      const board = await api<BoardData>(`/api/projects/${project.id}/boards`, {
        method: "POST",
        ...jsonBody({ name }),
      });
      setBoards((boards) => [...boards, { ...board, tasks: [] }]);
      setBoardName("");
      setAddingBoard(false);
    } catch (caught) {
      report(caught, "Could not add that column.");
    }
  }

  /* ----------------------------------------------------------- members --- */

  const handleInvited = useCallback(
    (member: MemberData) =>
      setProject((current) => ({ ...current, members: [...current.members, member] })),
    []
  );

  const canInvite = project.role === "OWNER" || project.role === "ADMIN";

  return (
    <main className="mx-auto max-w-[100rem] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-slate-900">{project.name}</h1>
          {project.description ? (
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{project.description}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {project.members.map((member) => (
              <span key={member.id} className="flex items-center gap-1.5">
                <Avatar user={member.user} size="sm" />
                <span className="text-xs text-slate-600">
                  {member.user.name}
                  {member.role !== "MEMBER" ? (
                    <span className="ml-1 text-[10px] uppercase tracking-wide text-slate-400">
                      {member.role}
                    </span>
                  ) : null}
                </span>
              </span>
            ))}
          </div>
        </div>

        {canInvite ? (
          <InviteMember projectId={project.id} onInvited={handleInvited} />
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 flex items-center justify-between gap-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded px-2 py-0.5 text-xs font-medium hover:bg-red-100"
          >
            Dismiss
          </button>
        </p>
      ) : null}

      <div className="mt-6 flex items-start gap-4 overflow-x-auto pb-4">
        {project.boards.map((board) => (
          <BoardColumn
            key={board.id}
            board={board}
            boards={project.boards}
            onOpenTask={setOpenTaskId}
            onMoveTask={(taskId, toBoardId) => void moveTask(taskId, toBoardId)}
            onCreateTask={createTask}
            onRenameBoard={renameBoard}
          />
        ))}

        <div className="w-72 shrink-0">
          {addingBoard ? (
            <form onSubmit={handleAddBoard} className="rounded-lg bg-slate-100 p-3">
              <input
                autoFocus
                value={boardName}
                maxLength={80}
                placeholder="Column name"
                aria-label="New column name"
                onChange={(event) => setBoardName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setAddingBoard(false);
                }}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={!boardName.trim()}
                  className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  Add column
                </button>
                <button
                  type="button"
                  onClick={() => setAddingBoard(false)}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingBoard(true)}
              className="w-full rounded-lg border border-dashed border-slate-300 bg-white/60 px-3 py-3 text-sm font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
            >
              + Add board
            </button>
          )}
        </div>
      </div>

      {openTaskId ? (
        <TaskDetail
          taskId={openTaskId}
          boards={project.boards}
          members={project.members}
          onClose={() => setOpenTaskId(null)}
          onTaskChanged={handleTaskChanged}
          onTaskDeleted={handleTaskDeleted}
          onCommentAdded={handleCommentAdded}
        />
      ) : null}
    </main>
  );
}
