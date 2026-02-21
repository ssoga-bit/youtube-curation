// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VideoCard } from "./VideoCard";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

const baseVideo = {
  id: "vid-1",
  title: "Pythonで学ぶ機械学習入門",
  channel: "AI学習チャンネル",
  durationMin: 15,
  tags: ["python", "ai", "ml"],
  beginnerComfortIndex: 75,
  transcriptSummary: null as string | null,
};

describe("VideoCard", () => {
  it("title を表示する", () => {
    render(<VideoCard video={baseVideo} />);
    expect(screen.getByText("Pythonで学ぶ機械学習入門")).toBeInTheDocument();
  });

  it("channel を表示する", () => {
    render(<VideoCard video={baseVideo} />);
    expect(screen.getByText("AI学習チャンネル")).toBeInTheDocument();
  });

  it("durationMin を表示する", () => {
    render(<VideoCard video={baseVideo} />);
    const durationTexts = screen.getAllByText("15分");
    expect(durationTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("タグを3個まで表示する", () => {
    const video = {
      ...baseVideo,
      tags: ["python", "ai", "ml", "data", "extra"],
    };
    render(<VideoCard video={video} />);
    expect(screen.getByText("python")).toBeInTheDocument();
    expect(screen.getByText("ai")).toBeInTheDocument();
    expect(screen.getByText("ml")).toBeInTheDocument();
    expect(screen.queryByText("data")).not.toBeInTheDocument();
    expect(screen.queryByText("extra")).not.toBeInTheDocument();
  });

  it("transcriptSummary を60文字+省略で表示する", () => {
    const longSummary = "あ".repeat(100);
    const video = { ...baseVideo, transcriptSummary: longSummary };
    render(<VideoCard video={video} />);
    const expected = "あ".repeat(60) + "...";
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("transcriptSummary が null のとき非表示", () => {
    const { container } = render(<VideoCard video={baseVideo} />);
    // Summary paragraph uses text-xs text-slate-400 mt-2
    const summaryP = container.querySelector("p.text-slate-400.mt-2");
    expect(summaryP).not.toBeInTheDocument();
  });

  it("リンク先が /videos/{id} になっている", () => {
    render(<VideoCard video={baseVideo} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/videos/vid-1");
  });
});
