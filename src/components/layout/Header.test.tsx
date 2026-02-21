// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// Mock next-auth/react
const mockUseSession = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

describe("Header", () => {
  beforeEach(() => {
    mockUseSession.mockReset();
    mockSignIn.mockReset();
    mockSignOut.mockReset();
  });

  it("未認証時 → 'ログイン' ボタンが表示される", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    render(<Header />);
    expect(screen.getByText("ログイン")).toBeInTheDocument();
  });

  it("認証済み（user）→ ユーザー名と 'ログアウト' が表示される", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: "テストユーザー", email: "test@example.com", role: "user" },
      },
      status: "authenticated",
    });
    render(<Header />);
    expect(screen.getByText("テストユーザー")).toBeInTheDocument();
    expect(screen.getByText("ログアウト")).toBeInTheDocument();
  });

  it("認証済み（user）→ '管理' リンクが表示されない", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: "テストユーザー", email: "test@example.com", role: "user" },
      },
      status: "authenticated",
    });
    render(<Header />);
    expect(screen.queryByText("管理")).not.toBeInTheDocument();
  });

  it("認証済み（admin）→ '管理' リンクが表示される", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: "管理者", email: "admin@example.com", role: "admin" },
      },
      status: "authenticated",
    });
    render(<Header />);
    expect(screen.getByText("管理")).toBeInTheDocument();
  });

  it("loading 中 → 認証セクション（ログイン/ログアウト）が非表示", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "loading",
    });
    render(<Header />);
    expect(screen.queryByText("ログイン")).not.toBeInTheDocument();
    expect(screen.queryByText("ログアウト")).not.toBeInTheDocument();
  });
});
