import { NextResponse } from "next/server";
import { apiError, notFound, unauthorized } from "@/lib/api";
import { getProjectAccess } from "@/lib/authz";
import { isRealtimeConfigured, signRealtimeToken } from "@/lib/realtime";
import { getCurrentUser } from "@/lib/session";

/**
 * GET /api/projects/[id]/realtime-token — a short-lived token that lets the
 * caller's browser join this project's live-update room. Members only.
 * `503` means realtime is not configured; the board then works without it.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const access = await getProjectAccess(params.id, user.id);
  if (!access) return notFound("Project not found");

  if (!isRealtimeConfigured()) return apiError("Realtime is not configured", 503);

  return NextResponse.json({ token: signRealtimeToken(params.id, user.id) });
}
