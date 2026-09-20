import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/** Standard JSON error body: { error: string, details?: Record<string, string[]> } */
export function apiError(
  message: string,
  status: number,
  details?: Record<string, string[]>
) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export const unauthorized = () => apiError("You must be signed in", 401);
export const forbidden = (message = "You do not have access to this resource") =>
  apiError(message, 403);
export const notFound = (message = "Not found") => apiError(message, 404);

/** Turn a ZodError into a field -> messages map for the client to render. */
export function validationError(error: ZodError) {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (details[key] ??= []).push(issue.message);
  }
  return apiError("Validation failed", 422, details);
}

/** Parse a request body as JSON, returning null when it is absent or malformed. */
export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
