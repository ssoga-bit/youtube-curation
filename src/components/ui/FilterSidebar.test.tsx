// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterSidebar } from "./FilterSidebar";

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  level: "",
  onLevelChange: vi.fn(),
  durations: [] as string[],
  onDurationsChange: vi.fn(),
  languages: [] as string[],
  onLanguagesChange: vi.fn(),
  selectedTags: [] as string[],
  onTagsChange: vi.fn(),
};

function renderSidebar(overrides = {}) {
  const props = { ...defaultProps, ...overrides };
  // Reset all mocks for each render
  Object.values(props).forEach((v) => {
    if (typeof v === "function" && "mockClear" in v) {
      (v as ReturnType<typeof vi.fn>).mockClear();
    }
  });
  return render(<FilterSidebar {...props} />);
}

describe("FilterSidebar", () => {
  it("レベルラジオボタン選択で onLevelChange が呼ばれる", async () => {
    const onLevelChange = vi.fn();
    renderSidebar({ onLevelChange });
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("超入門"));
    expect(onLevelChange).toHaveBeenCalledWith("beginner");
  });

  it("再生時間チェックボックスのトグルで onDurationsChange が呼ばれる", async () => {
    const onDurationsChange = vi.fn();
    renderSidebar({ onDurationsChange });
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("10分以内"));
    expect(onDurationsChange).toHaveBeenCalledWith(["short"]);
  });

  it("選択済み再生時間の解除で onDurationsChange が呼ばれる", async () => {
    const onDurationsChange = vi.fn();
    renderSidebar({ durations: ["short"], onDurationsChange });
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("10分以内"));
    expect(onDurationsChange).toHaveBeenCalledWith([]);
  });

  it("言語チェックボックスのトグルで onLanguagesChange が呼ばれる", async () => {
    const onLanguagesChange = vi.fn();
    renderSidebar({ onLanguagesChange });
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("日本語"));
    expect(onLanguagesChange).toHaveBeenCalledWith(["ja"]);
  });

  it("タグボタンクリックで onTagsChange が呼ばれる", async () => {
    const onTagsChange = vi.fn();
    renderSidebar({ onTagsChange });
    const user = userEvent.setup();

    await user.click(screen.getByText("python"));
    expect(onTagsChange).toHaveBeenCalledWith(["python"]);
  });

  it("選択中タグの解除で onTagsChange が呼ばれる", async () => {
    const onTagsChange = vi.fn();
    renderSidebar({ selectedTags: ["python"], onTagsChange });
    const user = userEvent.setup();

    await user.click(screen.getByText("python"));
    expect(onTagsChange).toHaveBeenCalledWith([]);
  });

  it("選択中タグに bg-primary-600 クラスが適用される", () => {
    renderSidebar({ selectedTags: ["python"] });
    const tag = screen.getByText("python");
    expect(tag.className).toContain("bg-primary-600");
  });

  it("未選択タグに bg-slate-100 クラスが適用される", () => {
    renderSidebar({ selectedTags: [] });
    const tag = screen.getByText("python");
    expect(tag.className).toContain("bg-slate-100");
  });

  it("availableTags が渡されるとそのタグを表示する", () => {
    renderSidebar({ availableTags: ["react", "nextjs", "typescript"] });
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("nextjs")).toBeInTheDocument();
    expect(screen.getByText("typescript")).toBeInTheDocument();
    // デフォルトタグは表示されない
    expect(screen.queryByText("python")).not.toBeInTheDocument();
  });

  it("availableTags が空配列の場合はデフォルトタグを表示する", () => {
    renderSidebar({ availableTags: [] });
    expect(screen.getByText("python")).toBeInTheDocument();
  });
});
