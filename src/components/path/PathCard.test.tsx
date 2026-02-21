// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PathCard } from "./PathCard";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

const baseProps = {
  id: "path-1",
  title: "Python入門トラック",
  targetAudience: "プログラミング初心者",
  goal: "Pythonの基礎を理解する",
  totalTimeEstimate: 120,
  stepCount: 5,
};

describe("PathCard", () => {
  it("title を表示する", () => {
    render(<PathCard {...baseProps} />);
    expect(screen.getByText("Python入門トラック")).toBeInTheDocument();
  });

  it("targetAudience を表示する", () => {
    render(<PathCard {...baseProps} />);
    expect(screen.getByText("プログラミング初心者")).toBeInTheDocument();
  });

  it("goal を表示する", () => {
    render(<PathCard {...baseProps} />);
    expect(screen.getByText("Pythonの基礎を理解する")).toBeInTheDocument();
  });

  it("totalTimeEstimate を表示する", () => {
    render(<PathCard {...baseProps} />);
    expect(screen.getByText("約120分")).toBeInTheDocument();
  });

  it("stepCount を表示する", () => {
    render(<PathCard {...baseProps} />);
    expect(screen.getByText("5本の動画")).toBeInTheDocument();
  });

  it("リンク先が /paths/{id} になっている", () => {
    render(<PathCard {...baseProps} />);
    const link = screen.getByText("トラックを始める");
    expect(link.closest("a")).toHaveAttribute("href", "/paths/path-1");
  });

  it("targetAudience が null のとき非表示", () => {
    render(<PathCard {...baseProps} targetAudience={null} />);
    expect(screen.queryByText("プログラミング初心者")).not.toBeInTheDocument();
  });

  it("goal が null のとき非表示", () => {
    render(<PathCard {...baseProps} goal={null} />);
    expect(screen.queryByText("Pythonの基礎を理解する")).not.toBeInTheDocument();
  });

  it("totalTimeEstimate が null のとき非表示", () => {
    render(<PathCard {...baseProps} totalTimeEstimate={null} />);
    expect(screen.queryByText(/約.*分/)).not.toBeInTheDocument();
  });
});
