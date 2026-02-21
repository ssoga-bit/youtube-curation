import { NextRequest } from "next/server";

/**
 * Create a NextRequest for testing API routes.
 */
export function createRequest(
  url: string,
  options?: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
): NextRequest {
  const init: globalThis.RequestInit = {
    method: options?.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  };

  if (options?.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  return new NextRequest(new URL(url, "http://localhost:3010"), init as ConstructorParameters<typeof NextRequest>[1]);
}

/**
 * Parse a NextResponse JSON body.
 */
export async function parseJson<T = unknown>(response: Response): Promise<T> {
  return response.json();
}
