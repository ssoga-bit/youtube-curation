// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BCIBadge, BCIScoreBadge } from "./BCIBadge";

describe("BCIBadge", () => {
  it("score >= 70 → '超入門に最適' を表示", () => {
    render(<BCIBadge score={70} />);
    expect(screen.getByText("超入門に最適")).toBeInTheDocument();
  });

  it("score >= 50 → '入門OK' を表示", () => {
    render(<BCIBadge score={50} />);
    expect(screen.getByText("入門OK")).toBeInTheDocument();
  });

  it("score < 50 → 何もレンダリングしない", () => {
    const { container } = render(<BCIBadge score={30} />);
    expect(container.innerHTML).toBe("");
  });

  it("score = 100 → '超入門に最適' を表示", () => {
    render(<BCIBadge score={100} />);
    expect(screen.getByText("超入門に最適")).toBeInTheDocument();
  });

  it("score = 69 → '入門OK' を表示", () => {
    render(<BCIBadge score={69} />);
    expect(screen.getByText("入門OK")).toBeInTheDocument();
  });

  it("size='md' でクラスが追加される", () => {
    render(<BCIBadge score={70} size="md" />);
    const badge = screen.getByText("超入門に最適");
    expect(badge.className).toContain("text-sm");
    expect(badge.className).toContain("px-3");
  });
});

describe("BCIScoreBadge", () => {
  it("スコア値を表示する", () => {
    render(<BCIScoreBadge score={85} />);
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("score >= 70 → green スタイル", () => {
    render(<BCIScoreBadge score={75} />);
    const badge = screen.getByText("75");
    expect(badge.className).toContain("bg-green-100");
    expect(badge.className).toContain("text-green-800");
  });

  it("score >= 50 かつ < 70 → blue スタイル", () => {
    render(<BCIScoreBadge score={55} />);
    const badge = screen.getByText("55");
    expect(badge.className).toContain("bg-blue-100");
    expect(badge.className).toContain("text-blue-800");
  });

  it("score < 50 → slate スタイル", () => {
    render(<BCIScoreBadge score={30} />);
    const badge = screen.getByText("30");
    expect(badge.className).toContain("bg-slate-100");
    expect(badge.className).toContain("text-slate-600");
  });
});
