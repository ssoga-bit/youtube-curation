/**
 * API Client - shared fetch wrapper for client-side components.
 *
 * Centralises HTTP calls so every component uses the same error-handling,
 * headers and JSON serialisation logic.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);

  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) {
        errorMessage = body.error;
      }
    } catch {
      // response body was not JSON -- keep the default message
    }
    throw new ApiError(errorMessage, res.status);
  }

  // 204 No Content or empty body
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(url: string) => apiRequest<T>(url),

  post: <T>(url: string, body?: unknown) =>
    apiRequest<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  put: <T>(url: string, body?: unknown) =>
    apiRequest<T>(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  patch: <T>(url: string, body?: unknown) =>
    apiRequest<T>(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  delete: <T>(url: string) =>
    apiRequest<T>(url, { method: "DELETE" }),
};
