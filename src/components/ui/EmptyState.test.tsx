// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("message を表示する", () => {
    render(<EmptyState message="データがありません" />);
    expect(screen.getByText("データがありません")).toBeInTheDocument();
  });

  it("description を表示する", () => {
    render(
      <EmptyState message="データがありません" description="条件を変えてお試しください" />
    );
    expect(screen.getByText("条件を変えてお試しください")).toBeInTheDocument();
  });

  it("description が未指定なら表示しない", () => {
    const { container } = render(<EmptyState message="データがありません" />);
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(1);
  });

  it("デフォルトで Inbox アイコンがレンダリングされる", () => {
    const { container } = render(<EmptyState message="テスト" />);
    // lucide-react renders an SVG
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
