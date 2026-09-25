/** Thin fetch wrapper that turns the API error shape into a thrown ApiError. */

export class ApiError extends Error {
  status: number;
  details?: Record<string, string[]>;

  constructor(message: string, status: number, details?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection.", 0);
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload
        ? String(payload.error)
        : null) ?? "Something went wrong.";
    const details =
      payload && typeof payload === "object" && "details" in payload
        ? (payload.details as Record<string, string[]>)
        : undefined;
    throw new ApiError(message, response.status, details);
  }

  return payload as T;
}

export const jsonBody = (data: unknown) => ({ body: JSON.stringify(data) });
