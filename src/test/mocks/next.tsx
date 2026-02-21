import React from "react";
import { vi } from "vitest";

// next/link mock — renders as plain <a>
export function MockLink({
  href,
  children,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

// next/navigation stubs
export const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(),
}));

export const usePathname = vi.fn(() => "/");

export const useSearchParams = vi.fn(() => new URLSearchParams());
