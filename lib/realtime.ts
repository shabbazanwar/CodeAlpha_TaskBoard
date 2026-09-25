import { createHmac } from "node:crypto";
import type { BoardData, MemberData, TaskCardData } from "@/lib/types";

/**
 * Server-side half of Phase 6. API routes call `broadcast` after a successful
 * write; the standalone relay in realtime/server.mjs fans it out to every
 * browser in that project's room.
 *
 * Realtime is strictly best-effort: if it is not configured or the relay is
 * down, the write still succeeds and other members just see it on refresh.
 */

export type RealtimeEvent =
  | { event: "task:upsert"; payload: { actorId: string; task: TaskCardData } }
  | { event: "task:delete"; payload: { actorId: string; taskId: string } }
  | { event: "comment:added"; payload: { actorId: string; taskId: string } }
  | { event: "board:upsert"; payload: { actorId: string; board: Omit<BoardData, "tasks"> } }
  | { event: "member:added"; payload: { actorId: string; member: MemberData } };

const TOKEN_TTL_MS = 5 * 60 * 1000;

export const isRealtimeConfigured = () =>
  Boolean(process.env.REALTIME_URL && process.env.REALTIME_SECRET);

/** Short-lived proof that `userId` was a member of `projectId` a moment ago. */
export function signRealtimeToken(projectId: string, userId: string): string {
  const secret = process.env.REALTIME_SECRET;
  if (!secret) throw new Error("REALTIME_SECRET is not set");

  const body = Buffer.from(
    JSON.stringify({ projectId, userId, exp: Date.now() + TOKEN_TTL_MS })
  ).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export async function broadcast(projectId: string, message: RealtimeEvent): Promise<void> {
  if (!isRealtimeConfigured()) return;

  try {
    await fetch(`${process.env.REALTIME_URL}/emit`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-realtime-secret": process.env.REALTIME_SECRET as string,
      },
      body: JSON.stringify({ projectId, ...message }),
      signal: AbortSignal.timeout(2000),
    });
  } catch (error) {
    console.warn("Realtime broadcast failed:", error instanceof Error ? error.message : error);
  }
}
