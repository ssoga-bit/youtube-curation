import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.userProgress.deleteMany();
  await prisma.pathStep.deleteMany();
  await prisma.path.deleteMany();
  await prisma.video.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create sample user (ID must match DEMO_USER_ID in progress API)
  const user = await prisma.user.create({
    data: {
      id: "demo-user",
      email: "demo@example.com",
      name: "デモユーザー",
    },
  });

  // Create videos
  const videos = await Promise.all([
    prisma.video.create({
      data: {
        id: "v_python_intro",
        url: "https://www.youtube.com/watch?v=example1",
        title: "【超入門】Python入門 - ゼロから始めるプログラミング",
        channel: "プログラミングチャンネル",
        language: "ja",
        durationMin: 12,
        publishedAt: new Date("2025-05-12"),
        tags: JSON.stringify(["python", "beginner", "programming"]),
        hasCc: true,
        hasChapters: true,
        sourceNotes: "実演が分かりやすく、環境構築から丁寧に説明",
        qualityScore: 0.9,
        beginnerComfortIndex: 85,
        transcriptSummary:
          "Pythonの基本文法（変数、型、if文、for文）を短時間で学べる動画。環境構築から始まり、実際にコードを書きながら進めます。",
        glossary: JSON.stringify([
          { term: "変数", explain: "値に名前をつけて保存する箱のようなもの" },
          { term: "型", explain: "データの種類（数値、文字列など）" },
          { term: "if文", explain: "条件によって処理を分岐させる命令" },
        ]),
        deprecatedFlags: JSON.stringify([]),
        prerequisites: "なし（完全初心者OK）",
        learnings: JSON.stringify(["Pythonの環境構築ができる", "変数・型・if文・for文の基本が理解できる", "簡単なプログラムを書いて実行できる"]),
        difficulty: "easy",
        hasSampleCode: true,
        likeRatio: 0.95,
      },
    }),
    prisma.video.create({
      data: {
        id: "v_python_list",
        url: "https://www.youtube.com/watch?v=example2",
        title: "Python リスト・辞書の使い方【初心者向け】",
        channel: "プログラミングチャンネル",
        language: "ja",
        durationMin: 18,
        publishedAt: new Date("2025-06-01"),
        tags: JSON.stringify(["python", "beginner", "data-structures"]),
        hasCc: true,
        hasChapters: true,
        sourceNotes: "リストと辞書をハンズオンで学べる",
        qualityScore: 0.85,
        beginnerComfortIndex: 75,
        transcriptSummary:
          "リスト（配列）と辞書（ハッシュ）の基本操作を実践的に学びます。append、ループ、辞書のキーアクセスなど。",
        glossary: JSON.stringify([
          { term: "リスト", explain: "複数のデータをまとめて順番に管理するもの" },
          { term: "辞書", explain: "名前（キー）と値のペアでデータを管理するもの" },
        ]),
        deprecatedFlags: JSON.stringify([]),
        prerequisites: "Python基本文法（変数・if文・for文）",
        learnings: JSON.stringify(["リストの作成・追加・削除ができる", "辞書のキーアクセスとループ処理ができる", "リストと辞書を組み合わせたデータ構造を扱える"]),
        difficulty: "easy",
        hasSampleCode: true,
        likeRatio: 0.92,
      },
    }),
    prisma.video.create({
      data: {
        id: "v_python_func",
        url: "https://www.youtube.com/watch?v=example3",
        title: "Python 関数を理解しよう！初心者でもわかる解説",
        channel: "コードラボ",
        language: "ja",
        durationMin: 15,
        publishedAt: new Date("2025-04-20"),
        tags: JSON.stringify(["python", "beginner", "functions"]),
        hasCc: true,
        hasChapters: false,
        sourceNotes: "関数の概念を身近な例えで説明",
        qualityScore: 0.8,
        beginnerComfortIndex: 72,
        transcriptSummary:
          "関数の定義方法、引数、戻り値を日常の例えを使って解説。自分で関数を作れるようになります。",
        glossary: JSON.stringify([
          { term: "関数", explain: "まとまった処理に名前をつけて再利用できるもの" },
          { term: "引数", explain: "関数に渡すデータのこと" },
          { term: "戻り値", explain: "関数が処理結果として返すデータ" },
        ]),
        deprecatedFlags: JSON.stringify([]),
        prerequisites: "Python基本文法（変数・if文・for文・リスト）",
        learnings: JSON.stringify(["関数の定義と呼び出しができる", "引数と戻り値の仕組みが理解できる", "コードの再利用ができるようになる"]),
        difficulty: "easy",
        hasSampleCode: true,
        likeRatio: 0.88,
      },
    }),
    prisma.video.create({
      data: {
        id: "v_ai_intro",
        url: "https://www.youtube.com/watch?v=example4",
        title: "【2025年版】生成AIとは？超わかりやすく解説",
        channel: "AI解説チャンネル",
        language: "ja",
        durationMin: 10,
        publishedAt: new Date("2025-07-01"),
        tags: JSON.stringify(["ai", "generative-ai", "beginner"]),
        hasCc: true,
        hasChapters: true,
        sourceNotes: "生成AIの基礎概念を図解で丁寧に解説",
        qualityScore: 0.92,
        beginnerComfortIndex: 90,
        transcriptSummary:
          "生成AI（ChatGPT、Claude等）の仕組みを非エンジニアにも分かるように図解で解説。歴史、種類、活用事例まで。",
        glossary: JSON.stringify([
          { term: "生成AI", explain: "テキストや画像を新しく作り出せるAI" },
          { term: "LLM", explain: "大規模言語モデル。大量のテキストで学習したAI" },
          { term: "プロンプト", explain: "AIへの指示文・質問文のこと" },
        ]),
        deprecatedFlags: JSON.stringify([]),
        prerequisites: "なし（非エンジニアOK）",
        learnings: JSON.stringify(["生成AIの仕組みを説明できる", "ChatGPT・Claude等の違いが分かる", "AIの活用事例を理解できる"]),
        difficulty: "easy",
        hasSampleCode: false,
        likeRatio: 0.96,
      },
    }),
    prisma.video.create({
      data: {
        id: "v_prompt_eng",
        url: "https://www.youtube.com/watch?v=example5",
        title: "プロンプトエンジニアリング入門 - AIに上手に指示を出す方法",
        channel: "AI解説チャンネル",
        language: "ja",
        durationMin: 20,
        publishedAt: new Date("2025-08-15"),
        tags: JSON.stringify(["ai", "prompt-engineering", "beginner"]),
        hasCc: true,
        hasChapters: true,
        sourceNotes: "実践的なプロンプトのコツが学べる",
        qualityScore: 0.88,
        beginnerComfortIndex: 78,
        transcriptSummary:
          "AIに効果的な指示を出すテクニック。具体例を交えながら、良いプロンプトと悪いプロンプトの違いを解説。",
        glossary: JSON.stringify([
          { term: "プロンプトエンジニアリング", explain: "AIに適切な指示を出す技術・スキル" },
          { term: "Zero-shot", explain: "例を示さずに直接指示を出す方法" },
          { term: "Few-shot", explain: "いくつかの例を示してから指示を出す方法" },
        ]),
        deprecatedFlags: JSON.stringify([]),
        prerequisites: "生成AIの基本概念",
        learnings: JSON.stringify(["効果的なプロンプトを書ける", "Zero-shotとFew-shotを使い分けられる", "AIの回答品質を向上させるテクニックが分かる"]),
        difficulty: "easy",
        hasSampleCode: false,
        likeRatio: 0.91,
      },
    }),
    prisma.video.create({
      data: {
        id: "v_chatgpt_api",
        url: "https://www.youtube.com/watch?v=example6",
        title: "ChatGPT APIをPythonで使ってみよう【ハンズオン】",
        channel: "テックラボ",
        language: "ja",
        durationMin: 25,
        publishedAt: new Date("2025-03-10"),
        tags: JSON.stringify(["ai", "python", "api", "intermediate"]),
        hasCc: true,
        hasChapters: true,
        sourceNotes: "API利用の実践。Python基礎は必要",
        qualityScore: 0.82,
        beginnerComfortIndex: 55,
        transcriptSummary:
          "OpenAI APIを使ったチャットボットの作り方。APIキーの取得から実際のコード実装まで。",
        glossary: JSON.stringify([
          { term: "API", explain: "プログラムから他のサービスを利用するための窓口" },
          { term: "APIキー", explain: "サービスを利用するための認証用の文字列" },
        ]),
        deprecatedFlags: JSON.stringify([]),
        prerequisites: "Python基礎（関数・ライブラリimport）、生成AIの基本概念",
        learnings: JSON.stringify(["OpenAI APIの利用登録ができる", "PythonからAPIを呼び出せる", "簡単なチャットボットを作れる"]),
        difficulty: "normal",
        hasSampleCode: true,
        likeRatio: 0.87,
      },
    }),
    prisma.video.create({
      data: {
        id: "v_git_intro",
        url: "https://www.youtube.com/watch?v=example7",
        title: "Git入門 - はじめてのバージョン管理【超初心者向け】",
        channel: "コードラボ",
        language: "ja",
        durationMin: 14,
        publishedAt: new Date("2025-05-20"),
        tags: JSON.stringify(["git", "beginner", "tools"]),
        hasCc: true,
        hasChapters: true,
        sourceNotes: "Gitの概念から丁寧に。コマンドは最小限",
        qualityScore: 0.87,
        beginnerComfortIndex: 82,
        transcriptSummary:
          "バージョン管理の概念とGitの基本操作（init, add, commit, push）を超初心者向けに解説。",
        glossary: JSON.stringify([
          { term: "Git", explain: "ファイルの変更履歴を管理するツール" },
          { term: "コミット", explain: "変更内容を記録すること" },
          { term: "リポジトリ", explain: "プロジェクトの保管場所" },
        ]),
        deprecatedFlags: JSON.stringify([]),
        prerequisites: "なし（コマンドラインの基本操作ができると望ましい）",
        learnings: JSON.stringify(["バージョン管理の重要性が理解できる", "git init/add/commit/pushの基本操作ができる", "GitHubにコードをアップロードできる"]),
        difficulty: "easy",
        hasSampleCode: false,
        likeRatio: 0.93,
      },
    }),
    prisma.video.create({
      data: {
        id: "v_html_css",
        url: "https://www.youtube.com/watch?v=example8",
        title: "HTML & CSS 超入門 - Webページを作ってみよう",
        channel: "Web制作チャンネル",
        language: "ja",
        durationMin: 30,
        publishedAt: new Date("2025-02-14"),
        tags: JSON.stringify(["html", "css", "web", "beginner"]),
        hasCc: true,
        hasChapters: true,
        sourceNotes: "ゼロからWebページを作る体験ができる",
        qualityScore: 0.84,
        beginnerComfortIndex: 70,
        transcriptSummary:
          "HTMLの基本タグとCSSのスタイリングを使って、簡単なWebページを作ります。実際に手を動かしながら学習。",
        glossary: JSON.stringify([
          { term: "HTML", explain: "Webページの骨組み（構造）を書く言語" },
          { term: "CSS", explain: "Webページの見た目（デザイン）を指定する言語" },
          { term: "タグ", explain: "HTMLで要素を定義するための記号（<p>など）" },
        ]),
        deprecatedFlags: JSON.stringify([]),
        prerequisites: "なし（テキストエディタの操作ができればOK）",
        learnings: JSON.stringify(["HTMLの基本タグを使える", "CSSでスタイリングできる", "簡単なWebページを一人で作れる"]),
        difficulty: "easy",
        hasSampleCode: true,
        likeRatio: 0.89,
      },
    }),
    prisma.video.create({
      data: {
        id: "v_math_basics",
        url: "https://www.youtube.com/watch?v=example9",
        title: "AI数学の基礎 - 確率・統計をやさしく解説",
        channel: "数学チャンネル",
        language: "ja",
        durationMin: 22,
        publishedAt: new Date("2025-04-05"),
        tags: JSON.stringify(["math", "statistics", "ai", "beginner"]),
        hasCc: true,
        hasChapters: false,
        sourceNotes: "数学が苦手な人向け。図やアニメーションが豊富",
        qualityScore: 0.78,
        beginnerComfortIndex: 60,
        transcriptSummary:
          "AIの基礎となる確率・統計の概念を直感的に解説。平均、分散、正規分布を身近な例で学びます。",
        glossary: JSON.stringify([
          { term: "確率", explain: "あることが起こる可能性の度合い" },
          { term: "平均", explain: "データの合計をデータの個数で割った値" },
          { term: "分散", explain: "データのばらつき具合を数値で表したもの" },
        ]),
        deprecatedFlags: JSON.stringify([]),
        prerequisites: "中学数学レベル（四則演算・割合）",
        learnings: JSON.stringify(["確率の基本概念が理解できる", "平均・分散・標準偏差を計算できる", "正規分布の概念がイメージできる"]),
        difficulty: "normal",
        hasSampleCode: false,
        likeRatio: 0.85,
      },
    }),
    prisma.video.create({
      data: {
        id: "v_ai_ethics",
        url: "https://www.youtube.com/watch?v=example10",
        title: "AI倫理入門 - 知っておくべきAIのリスクと課題",
        channel: "AI解説チャンネル",
        language: "ja",
        durationMin: 15,
        publishedAt: new Date("2025-09-01"),
        tags: JSON.stringify(["ai", "ethics", "beginner"]),
        hasCc: true,
        hasChapters: true,
        sourceNotes: "AIのリスクと倫理を身近な事例で解説",
        qualityScore: 0.8,
        beginnerComfortIndex: 75,
        transcriptSummary:
          "AIの偏見、プライバシー、著作権、雇用への影響など、AI利用時に知っておくべき倫理的課題を解説。",
        glossary: JSON.stringify([
          { term: "バイアス", explain: "データや判断の偏り" },
          { term: "ハルシネーション", explain: "AIが事実でないことをもっともらしく生成すること" },
        ]),
        deprecatedFlags: JSON.stringify([]),
        prerequisites: "生成AIの基本概念",
        learnings: JSON.stringify(["AIバイアスの問題を理解できる", "著作権・プライバシーのリスクが分かる", "責任あるAI利用の考え方が身につく"]),
        difficulty: "easy",
        hasSampleCode: false,
        likeRatio: 0.9,
      },
    }),
    prisma.video.create({
      data: {
        id: "v_python_en",
        url: "https://www.youtube.com/watch?v=example11",
        title: "Python for Absolute Beginners - Full Course",
        channel: "freeCodeCamp",
        language: "en",
        durationMin: 45,
        publishedAt: new Date("2025-01-15"),
        tags: JSON.stringify(["python", "beginner", "programming"]),
        hasCc: true,
        hasChapters: true,
        sourceNotes: "英語だが字幕付きで分かりやすい",
        qualityScore: 0.9,
        beginnerComfortIndex: 65,
        transcriptSummary:
          "A comprehensive Python beginner course covering variables, types, loops, functions, and basic data structures.",
        glossary: JSON.stringify([
          { term: "variable", explain: "A named container for storing data values" },
          { term: "function", explain: "A reusable block of code that performs a specific task" },
        ]),
        deprecatedFlags: JSON.stringify([]),
        prerequisites: "None (absolute beginners welcome)",
        learnings: JSON.stringify(["Understand Python variables and types", "Write loops and conditional statements", "Define and call functions"]),
        difficulty: "easy",
        hasSampleCode: true,
        likeRatio: 0.94,
      },
    }),
    prisma.video.create({
      data: {
        id: "v_ai_history",
        url: "https://www.youtube.com/watch?v=example12",
        title: "AIの歴史 - チューリングから生成AIまで【10分でわかる】",
        channel: "テックヒストリー",
        language: "ja",
        durationMin: 10,
        publishedAt: new Date("2025-06-20"),
        tags: JSON.stringify(["ai", "history", "beginner"]),
        hasCc: true,
        hasChapters: true,
        sourceNotes: "AIの歴史を時系列で分かりやすく",
        qualityScore: 0.85,
        beginnerComfortIndex: 88,
        transcriptSummary:
          "1950年代のチューリングテストから現代の生成AIまで、AIの発展の歴史をコンパクトに解説。",
        glossary: JSON.stringify([
          { term: "チューリングテスト", explain: "AIが人間と区別できないかを判定するテスト" },
          { term: "ディープラーニング", explain: "脳の仕組みを参考にしたAIの学習方法" },
        ]),
        deprecatedFlags: JSON.stringify([]),
        prerequisites: "なし（興味があればOK）",
        learnings: JSON.stringify(["AIブームの歴史（3回）を説明できる", "機械学習とディープラーニングの違いが分かる", "生成AIの登場背景を理解できる"]),
        difficulty: "easy",
        hasSampleCode: false,
        likeRatio: 0.91,
      },
    }),
  ]);

  // Create learning paths
  const pythonPath = await prisma.path.create({
    data: {
      id: "path_python_intro",
      title: "はじめてのPython：合計90分",
      targetAudience: "プログラミング完全初心者（ゼロからOK）",
      goal: "Pythonの基本文法を理解し、簡単なプログラムを自分で書けるようになる",
      totalTimeEstimate: 45,
      steps: {
        create: [
          {
            videoId: "v_python_intro",
            order: 1,
            whyThis: "まずはPythonの世界への第一歩。環境構築から基本文法まで一気に学べます。",
            checkpointQuestion: "変数に値を代入して、print()で表示できましたか？",
          },
          {
            videoId: "v_python_list",
            order: 2,
            whyThis: "データをまとめて扱う方法を学びます。プログラミングで最も使う機能の一つです。",
            checkpointQuestion: "リストに要素を追加して、ループで全要素を表示できましたか？",
          },
          {
            videoId: "v_python_func",
            order: 3,
            whyThis: "関数を使えるようになると、コードの再利用ができて効率的になります。",
            checkpointQuestion: "引数を受け取って戻り値を返す関数を自分で作れましたか？",
          },
        ],
      },
    },
  });

  const aiPath = await prisma.path.create({
    data: {
      id: "path_ai_intro",
      title: "生成AIの超入門：合計60分",
      targetAudience: "AIに興味がある非エンジニア・文系の方",
      goal: "生成AIの基礎概念を理解し、効果的にAIツールを活用できるようになる",
      totalTimeEstimate: 55,
      steps: {
        create: [
          {
            videoId: "v_ai_history",
            order: 1,
            whyThis: "まずAIの全体像を掴みましょう。歴史を知ると現在の技術がよく分かります。",
            checkpointQuestion: "AIブームが何回あったか説明できますか？",
          },
          {
            videoId: "v_ai_intro",
            order: 2,
            whyThis: "生成AIの仕組みと種類を理解する核心の動画です。",
            checkpointQuestion: "生成AIとは何かを、友達に説明できますか？",
          },
          {
            videoId: "v_prompt_eng",
            order: 3,
            whyThis: "理論を知ったら、実際にAIを上手に使うスキルを身につけましょう。",
            checkpointQuestion: "Zero-shotとFew-shotの違いが説明できますか？",
          },
          {
            videoId: "v_ai_ethics",
            order: 4,
            whyThis: "AIを使う上で知っておくべきリスクと倫理を学びます。",
            checkpointQuestion: "AIのハルシネーションとは何か説明できますか？",
          },
        ],
      },
    },
  });

  // Create admin user
  await prisma.user.create({
    data: {
      id: "admin-user",
      email: "admin@example.com",
      name: "管理者",
      role: "admin",
    },
  });

  // Create some user progress
  await prisma.userProgress.createMany({
    data: [
      { userId: user.id, videoId: "v_python_intro", watched: true, bookmarked: true },
      { userId: user.id, videoId: "v_ai_intro", watched: false, bookmarked: true },
    ],
  });

  console.log("Seed data created successfully!");
  console.log(`  - ${videos.length} videos`);
  console.log(`  - 2 learning paths`);
  console.log(`  - 1 demo user`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
