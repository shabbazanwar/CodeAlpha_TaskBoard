"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { BoardColumn } from "@/components/board/board-column";
import { TaskCardBody } from "@/components/board/task-card";
import {
  applyRemoteTask,
  findTask,
  moveTaskLocal,
  patchTaskLocal,
  removeTaskLocal,
  upsertBoardLocal,
  upsertTaskLocal,
} from "@/components/board/board-state";
import { useProjectRealtime } from "@/components/board/use-project-realtime";
import { InviteMember } from "@/components/board/invite-member";
import { TaskDetail } from "@/components/board/task-detail";
import { AvatarStack } from "@/components/ui/avatar";
import { ApiError, api, jsonBody } from "@/lib/client";
import type { BoardData, MemberData, ProjectBoardData, TaskCardData } from "@/lib/types";

export function BoardView({
  project: initialProject,
  currentUserId,
}: {
  project: ProjectBoardData;
  currentUserId: string;
}) {
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

  /* ----------------------------------------------------- drag and drop --- */

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    // Mouse: a small distance lets plain clicks on the card title and select through.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Touch: press and hold to pick a card up, so a normal swipe still scrolls the board.
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => setDraggingId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const current = findTask(project.boards, taskId);
    if (!current) return;

    const overId = String(over.id);
    let toBoardId: string;
    let toIndex: number;

    if (overId.startsWith("column:")) {
      toBoardId = overId.slice("column:".length);
      const column = project.boards.find((board) => board.id === toBoardId);
      if (!column) return;
      // Dropped on the column itself: stay put in the same column, else append.
      toIndex = toBoardId === current.boardId ? current.position : column.tasks.length;
    } else {
      const overTask = findTask(project.boards, overId);
      if (!overTask) return;
      toBoardId = overTask.boardId;
      const overIndex = (project.boards.find((board) => board.id === toBoardId)?.tasks ?? []).findIndex(
        (task) => task.id === overId
      );

      if (toBoardId === current.boardId) {
        toIndex = overIndex;
      } else {
        // Cross-column: insert before the hovered card, or after it when the
        // dragged card sits past its midpoint.
        const translated = active.rect.current.translated;
        const below = translated != null && translated.top > over.rect.top + over.rect.height / 2;
        toIndex = overIndex + (below ? 1 : 0);
      }
    }

    if (toBoardId === current.boardId && toIndex === current.position) return;
    void moveTask(taskId, toBoardId, toIndex);
  };

  const draggingTask = draggingId ? findTask(project.boards, draggingId) : undefined;

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

  /* --------------------------------------------------------- real time --- */

  useProjectRealtime(project.id, {
    onResync: setProject,
    onEvent: (message) => {
      // Our own changes were already applied optimistically.
      if (message.payload.actorId === currentUserId) return;

      switch (message.event) {
        case "task:upsert":
          setBoards((boards) => applyRemoteTask(boards, message.payload.task));
          break;
        case "task:delete":
          setBoards((boards) => removeTaskLocal(boards, message.payload.taskId));
          setOpenTaskId((open) => (open === message.payload.taskId ? null : open));
          break;
        case "comment:added":
          handleCommentAdded(message.payload.taskId);
          break;
        case "board:upsert":
          setBoards((boards) => upsertBoardLocal(boards, message.payload.board));
          break;
        case "member:added":
          setProject((current) =>
            current.members.some((member) => member.id === message.payload.member.id)
              ? current
              : { ...current, members: [...current.members, message.payload.member] }
          );
          break;
      }
    },
  });

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

  const totalTasks = project.boards.reduce((sum, board) => sum + board.tasks.length, 0);
  const doneTasks = project.boards
    .filter((board) => /(done|complete|shipped|closed)/i.test(board.name))
    .reduce((sum, board) => sum + board.tasks.length, 0);
  const progress = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  return (
    <main className="mx-auto max-w-[100rem] px-4 py-8 sm:px-6">
      <div className="animate-rise-in flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 transition hover:text-indigo-600"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6">
              <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All projects
          </Link>
          <h1 className="mt-2 truncate text-3xl font-semibold tracking-tight text-ink-900">
            {project.name}
          </h1>
          {project.description ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">
              {project.description}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-2.5">
              <AvatarStack users={project.members.map((member) => member.user)} max={6} />
              <span className="text-xs font-medium text-ink-500">
                {project.members.length} member{project.members.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="flex items-center gap-2.5" title={`${doneTasks} of ${totalTasks} tasks done`}>
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-ink-500">
                {totalTasks === 0 ? "No tasks yet" : `${progress}% done · ${totalTasks} tasks`}
              </span>
            </div>
          </div>
        </div>

        {canInvite ? <InviteMember projectId={project.id} onInvited={handleInvited} /> : null}
      </div>

      {error ? (
        <p role="alert" className="alert-error mt-5 animate-pop-in items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="btn-ghost btn-sm">
            Dismiss
          </button>
        </p>
      ) : null}

      <DndContext
        // A fixed id keeps dnd-kit's generated aria ids identical on server and client.
        id="board-dnd"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDraggingId(null)}
      >
        <div className="-mx-4 mt-7 flex snap-x snap-proximity items-start gap-3 overflow-x-auto px-4 pb-6 sm:mx-0 sm:gap-4 sm:px-0">
          {project.boards.map((board, index) => (
            <BoardColumn
              key={board.id}
              board={board}
              index={index}
              boards={project.boards}
              onOpenTask={setOpenTaskId}
              onMoveTask={(taskId, toBoardId) => void moveTask(taskId, toBoardId)}
              onCreateTask={createTask}
              onRenameBoard={renameBoard}
            />
          ))}

          <div className="w-[82vw] max-w-[19rem] shrink-0 snap-start">
            {addingBoard ? (
              <form onSubmit={handleAddBoard} className="card animate-pop-in p-3">
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
                  className="input"
                />
                <div className="mt-2.5 flex gap-2">
                  <button type="submit" disabled={!boardName.trim()} className="btn-primary btn-sm">
                    Add column
                  </button>
                  <button type="button" onClick={() => setAddingBoard(false)} className="btn-ghost btn-sm">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAddingBoard(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 bg-white/40 px-3 py-4 text-sm font-medium text-ink-500 transition hover:border-indigo-300 hover:bg-white/80 hover:text-indigo-600"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Add column
              </button>
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
          {draggingTask ? (
            <div className="w-[17.5rem] rotate-2 cursor-grabbing shadow-pop">
              <TaskCardBody task={draggingTask} boards={project.boards} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {openTaskId ? (
        <TaskDetail
          taskId={openTaskId}
          initialTask={findTask(project.boards, openTaskId)}
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
