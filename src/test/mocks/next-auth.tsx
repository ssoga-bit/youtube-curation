import React from "react";
import { vi } from "vitest";

export const useSession = vi.fn(() => ({
  data: null,
  status: "unauthenticated" as const,
}));

export const signIn = vi.fn();
export const signOut = vi.fn();

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
