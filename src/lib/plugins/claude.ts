import Anthropic from "@anthropic-ai/sdk";
import type { LLMSummaryResult } from "@/lib/llm";
import type { SummarizerPlugin, SummarizerInput, PluginConfigField } from "./types";
import { validateSummaryResult } from "./validate";

const PROMPT_TEMPLATE = (videoTitle: string, transcript: string) =>
  `あなたは教育編集者です。以下のYouTube動画の転写テキストから初心者向けにまとめてください。

動画タイトル: ${videoTitle}

転写テキスト:
${transcript}

以下のJSON形式で出力してください（JSON以外は出力しないでください）:
{
  "transcriptSummary": "要約（最大5文）",
  "prerequisites": "前提知識（なければ「不要」）",
  "learnings": ["得られること1", "得られること2", "得られること3"],
  "difficulty": "easy | normal | hard",
  "deprecatedFlags": ["つまずき注意点（早口/環境依存/古いAPIなど）"],
  "glossary": [{"term": "用語", "explain": "やさしい説明"}]
}

注意:
- 難易度判定基準: easy=専門用語なし・具体例豊富, normal=一部専門用語あり, hard=専門知識前提
- 用語辞書は最大5語、初心者にとって難しい用語を選択
- つまずき注意点は該当する場合のみ
- 要約は初心者がこの動画を見るべきか判断できる内容に`;

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export const claudePlugin: SummarizerPlugin = {
  name: "Claude (Direct API)",
  key: "claude",
  configSchema: [
    {
      key: "apiKey",
      label: "API Key",
      type: "password",
      required: false,
      placeholder: "sk-ant-... (未設定時は環境変数を使用)",
    },
    {
      key: "model",
      label: "Model",
      type: "text",
      required: false,
      placeholder: DEFAULT_MODEL,
    },
  ] satisfies PluginConfigField[],

  async summarize(
    input: SummarizerInput,
    config: Record<string, string>
  ): Promise<LLMSummaryResult> {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    const model = config.model || DEFAULT_MODEL;

    const anthropic = new Anthropic(apiKey ? { apiKey } : undefined);

    const message = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: PROMPT_TEMPLATE(input.videoTitle, input.transcript),
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content in Claude response");
    }

    const rawText = textBlock.text.trim();

    let jsonText = rawText;
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText);
    return validateSummaryResult(parsed, input.videoTitle);
  },
};
