"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { api } from "@/lib/client";
import type { RealtimeEvent } from "@/lib/realtime";
import type { ProjectBoardData } from "@/lib/types";

type Handlers = {
  onEvent: (message: RealtimeEvent) => void;
  /** Called with a fresh snapshot after a dropped connection comes back. */
  onResync: (project: ProjectBoardData) => void;
};

const EVENTS: RealtimeEvent["event"][] = [
  "task:upsert",
  "task:delete",
  "comment:added",
  "board:upsert",
  "member:added",
];

/**
 * Subscribes to the project's live-update room. Does nothing when
 * NEXT_PUBLIC_REALTIME_URL is unset, so the board works fine without it.
 * The socket is closed on unmount, so navigating away never leaks a connection.
 */
export function useProjectRealtime(projectId: string, handlers: Handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_REALTIME_URL;
    if (!url) return;

    let hasConnectedBefore = false;

    const socket = io(url, {
      // Re-evaluated on every (re)connect, because tokens are short-lived.
      auth: (callback) => {
        api<{ token: string }>(`/api/projects/${projectId}/realtime-token`)
          .then(({ token }) => callback({ token }))
          .catch(() => callback({ token: "" }));
      },
    });

    for (const event of EVENTS) {
      socket.on(event, (payload) => handlersRef.current.onEvent({ event, payload } as RealtimeEvent));
    }

    socket.on("connect", () => {
      // Anything that happened while we were offline was missed; reload it.
      if (hasConnectedBefore) {
        api<ProjectBoardData>(`/api/projects/${projectId}`)
          .then((project) => handlersRef.current.onResync(project))
          .catch(() => undefined);
      }
      hasConnectedBefore = true;
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [projectId]);
}
