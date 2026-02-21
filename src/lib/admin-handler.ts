import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";

/**
 * Wrap an admin API route handler with auth check and error handling.
 * - Returns 403 if the user is not an admin.
 * - Catches errors, logs them, and returns a 500 response.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adminHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  errorMessage: string
): T {
  const wrapped = async (...args: Parameters<T>): Promise<NextResponse> => {
    try {
      const session = await getServerSession(authOptions);
      if (!(await isAdmin(session))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return await handler(...args);
    } catch (error) {
      console.error(errorMessage + ":", error);
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  };
  return wrapped as T;
}
