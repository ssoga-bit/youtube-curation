// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoTable } from "./VideoTable";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/admin/SummarizeButton", () => ({
  SummarizeButton: () => <button aria-label="AI要約">AI要約</button>,
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const baseVideos = [
  {
    id: "vid-1",
    title: "Pythonで学ぶ機械学習入門",
    url: "https://www.youtube.com/watch?v=abc123",
    channel: "AI学習チャンネル",
    beginnerComfortIndex: 80,
    tags: ["python", "ai", "ml"],
    isPublished: true,
    difficulty: "easy",
    durationMin: 15,
  },
  {
    id: "vid-2",
    title: "TypeScript実践ガイド",
    url: "https://www.youtube.com/watch?v=def456",
    channel: "Web開発チャンネル",
    beginnerComfortIndex: 55,
    tags: ["typescript", "web"],
    isPublished: false,
    difficulty: "normal",
    durationMin: 30,
  },
];

const noop = vi.fn().mockResolvedValue(undefined);

function renderTable(overrides?: Partial<React.ComponentProps<typeof VideoTable>>) {
  return render(
    <VideoTable
      videos={baseVideos}
      onTogglePublish={noop}
      onUpdate={noop}
      onDelete={noop}
      onRefresh={noop}
      {...overrides}
    />
  );
}

describe("VideoTable", () => {
  describe("テーブルのレンダリング", () => {
    it("テーブルヘッダーを表示する", () => {
      renderTable();
      expect(screen.getByText("タイトル")).toBeInTheDocument();
      expect(screen.getByText("チャンネル")).toBeInTheDocument();
      expect(screen.getByText("BCI")).toBeInTheDocument();
      expect(screen.getByText("タグ")).toBeInTheDocument();
      expect(screen.getByText("状態")).toBeInTheDocument();
      expect(screen.getByText("操作")).toBeInTheDocument();
    });

    it("各動画のタイトルを表示する", () => {
      renderTable();
      expect(screen.getByText("Pythonで学ぶ機械学習入門")).toBeInTheDocument();
      expect(screen.getByText("TypeScript実践ガイド")).toBeInTheDocument();
    });

    it("各動画のチャンネルを表示する", () => {
      renderTable();
      expect(screen.getByText("AI学習チャンネル")).toBeInTheDocument();
      expect(screen.getByText("Web開発チャンネル")).toBeInTheDocument();
    });

    it("公開状態を表示する（公開・非公開）", () => {
      renderTable();
      expect(screen.getByText("公開")).toBeInTheDocument();
      expect(screen.getByText("非公開")).toBeInTheDocument();
    });

    it("タグをそれぞれ表示する", () => {
      renderTable();
      expect(screen.getByText("python")).toBeInTheDocument();
      expect(screen.getByText("ai")).toBeInTheDocument();
      expect(screen.getByText("ml")).toBeInTheDocument();
      expect(screen.getByText("typescript")).toBeInTheDocument();
      expect(screen.getByText("web")).toBeInTheDocument();
    });

    it("タグが4個以上のとき超過分を +N 表示する", () => {
      const videos = [
        {
          ...baseVideos[0],
          tags: ["python", "ai", "ml", "data", "extra"],
        },
      ];
      render(
        <VideoTable
          videos={videos}
          onTogglePublish={noop}
          onUpdate={noop}
          onDelete={noop}
        />
      );
      expect(screen.getByText("+2")).toBeInTheDocument();
      expect(screen.queryByText("data")).not.toBeInTheDocument();
      expect(screen.queryByText("extra")).not.toBeInTheDocument();
    });
  });

  describe("空状態", () => {
    it("videos が空のとき空状態メッセージを表示する", () => {
      render(
        <VideoTable
          videos={[]}
          onTogglePublish={noop}
          onUpdate={noop}
          onDelete={noop}
        />
      );
      expect(screen.getByText("該当する動画がありません")).toBeInTheDocument();
    });

    it("videos が空のとき table 行は存在しない", () => {
      render(
        <VideoTable
          videos={[]}
          onTogglePublish={noop}
          onUpdate={noop}
          onDelete={noop}
        />
      );
      const rows = screen.queryAllByRole("row");
      // Only the header row should be present
      expect(rows).toHaveLength(1);
    });
  });

  describe("検索フィルタリング", () => {
    it("検索ボックスが表示される", () => {
      renderTable();
      expect(
        screen.getByPlaceholderText("タイトル・チャンネル・タグで検索...")
      ).toBeInTheDocument();
    });

    it("タイトルで絞り込みができる", async () => {
      const user = userEvent.setup();
      renderTable();

      const searchInput = screen.getByRole("textbox", {
        name: "タイトル・チャンネル・タグで検索",
      });
      await user.type(searchInput, "Python");

      expect(screen.getByText("Pythonで学ぶ機械学習入門")).toBeInTheDocument();
      expect(screen.queryByText("TypeScript実践ガイド")).not.toBeInTheDocument();
    });

    it("チャンネルで絞り込みができる", async () => {
      const user = userEvent.setup();
      renderTable();

      const searchInput = screen.getByRole("textbox", {
        name: "タイトル・チャンネル・タグで検索",
      });
      await user.type(searchInput, "Web開発");

      expect(screen.queryByText("Pythonで学ぶ機械学習入門")).not.toBeInTheDocument();
      expect(screen.getByText("TypeScript実践ガイド")).toBeInTheDocument();
    });

    it("タグで絞り込みができる", async () => {
      const user = userEvent.setup();
      renderTable();

      const searchInput = screen.getByRole("textbox", {
        name: "タイトル・チャンネル・タグで検索",
      });
      await user.type(searchInput, "typescript");

      expect(screen.queryByText("Pythonで学ぶ機械学習入門")).not.toBeInTheDocument();
      expect(screen.getByText("TypeScript実践ガイド")).toBeInTheDocument();
    });

    it("マッチしない検索語では空状態を表示する", async () => {
      const user = userEvent.setup();
      renderTable();

      const searchInput = screen.getByRole("textbox", {
        name: "タイトル・チャンネル・タグで検索",
      });
      await user.type(searchInput, "存在しないキーワード12345");

      expect(screen.getByText("該当する動画がありません")).toBeInTheDocument();
    });

    it("検索は大文字小文字を区別しない", async () => {
      const user = userEvent.setup();
      renderTable();

      const searchInput = screen.getByRole("textbox", {
        name: "タイトル・チャンネル・タグで検索",
      });
      await user.type(searchInput, "PYTHON");

      expect(screen.getByText("Pythonで学ぶ機械学習入門")).toBeInTheDocument();
    });
  });

  describe("公開・非公開トグル", () => {
    it("公開中の動画には「非公開にする」ボタンがある", () => {
      renderTable();
      expect(
        screen.getByRole("button", { name: "非公開にする" })
      ).toBeInTheDocument();
    });

    it("非公開の動画には「公開する」ボタンがある", () => {
      renderTable();
      expect(screen.getByRole("button", { name: "公開する" })).toBeInTheDocument();
    });

    it("「非公開にする」ボタンをクリックすると onTogglePublish が呼ばれる", async () => {
      const user = userEvent.setup();
      const onTogglePublish = vi.fn().mockResolvedValue(undefined);
      render(
        <VideoTable
          videos={baseVideos}
          onTogglePublish={onTogglePublish}
          onUpdate={noop}
          onDelete={noop}
        />
      );

      await user.click(screen.getByRole("button", { name: "非公開にする" }));

      expect(onTogglePublish).toHaveBeenCalledWith("vid-1", false);
    });

    it("「公開する」ボタンをクリックすると onTogglePublish が呼ばれる", async () => {
      const user = userEvent.setup();
      const onTogglePublish = vi.fn().mockResolvedValue(undefined);
      render(
        <VideoTable
          videos={baseVideos}
          onTogglePublish={onTogglePublish}
          onUpdate={noop}
          onDelete={noop}
        />
      );

      await user.click(screen.getByRole("button", { name: "公開する" }));

      expect(onTogglePublish).toHaveBeenCalledWith("vid-2", true);
    });
  });

  describe("編集モード", () => {
    it("「編集」ボタンをクリックするとタイトル入力欄が表示される", async () => {
      const user = userEvent.setup();
      renderTable();

      const editButtons = screen.getAllByRole("button", { name: "編集" });
      await user.click(editButtons[0]);

      const inputs = screen.getAllByRole("textbox");
      // The title input within the row should appear (plus search and tags input)
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it("編集中に「保存」ボタンと「キャンセル」ボタンが表示される", async () => {
      const user = userEvent.setup();
      renderTable();

      const editButtons = screen.getAllByRole("button", { name: "編集" });
      await user.click(editButtons[0]);

      expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "キャンセル" })).toBeInTheDocument();
    });

    it("「キャンセル」をクリックすると編集モードが終了する", async () => {
      const user = userEvent.setup();
      renderTable();

      const editButtons = screen.getAllByRole("button", { name: "編集" });
      await user.click(editButtons[0]);

      await user.click(screen.getByRole("button", { name: "キャンセル" }));

      expect(screen.queryByRole("button", { name: "保存" })).not.toBeInTheDocument();
      expect(screen.getByText("Pythonで学ぶ機械学習入門")).toBeInTheDocument();
    });

    it("「保存」ボタンをクリックすると onUpdate が呼ばれる", async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn().mockResolvedValue(undefined);
      render(
        <VideoTable
          videos={baseVideos}
          onTogglePublish={noop}
          onUpdate={onUpdate}
          onDelete={noop}
        />
      );

      const editButtons = screen.getAllByRole("button", { name: "編集" });
      await user.click(editButtons[0]);
      await user.click(screen.getByRole("button", { name: "保存" }));

      expect(onUpdate).toHaveBeenCalledWith(
        "vid-1",
        expect.objectContaining({ title: "Pythonで学ぶ機械学習入門" })
      );
    });
  });

  describe("削除モード", () => {
    it("「削除」ボタンをクリックすると確認 UI が表示される", async () => {
      const user = userEvent.setup();
      renderTable();

      const deleteButtons = screen.getAllByRole("button", { name: "削除" });
      await user.click(deleteButtons[0]);

      expect(screen.getByText("削除？")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "削除を確定" })).toBeInTheDocument();
    });

    it("削除確認後「キャンセル」で確認 UI が閉じる", async () => {
      const user = userEvent.setup();
      renderTable();

      const deleteButtons = screen.getAllByRole("button", { name: "削除" });
      await user.click(deleteButtons[0]);

      const cancelButtons = screen.getAllByRole("button", { name: "キャンセル" });
      await user.click(cancelButtons[0]);

      expect(screen.queryByText("削除？")).not.toBeInTheDocument();
    });

    it("「削除を確定」ボタンをクリックすると onDelete が呼ばれる", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn().mockResolvedValue(undefined);
      render(
        <VideoTable
          videos={baseVideos}
          onTogglePublish={noop}
          onUpdate={noop}
          onDelete={onDelete}
        />
      );

      const deleteButtons = screen.getAllByRole("button", { name: "削除" });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole("button", { name: "削除を確定" }));

      expect(onDelete).toHaveBeenCalledWith("vid-1");
    });
  });
});
