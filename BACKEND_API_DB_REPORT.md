# バックエンドAPI・DB構造の調査レポート

**作成日**: 2026-02-22
**調査者**: backend-reviewer
**対象プロジェクト**: YouTube-Curation

---

## 1. APIルート一覧（完全マッピング）

### 1.1 公開API（認証不要またはセッション認証）

#### `/api/videos` - 動画一覧取得（フィルタ・検索対応）
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `GET` |
| **認証** | 不要（公開） |
| **機能** | 動画の一覧取得、フィルタリング、検索、ページネーション |
| **クエリパラメータ** | `page`, `limit`, `level`(beginner/intermediate), `duration`(short/medium/long), `language`, `tags`(カンマ区切り), `sort`(bci/newest/popular/recommended), `q`(全文検索) |
| **レスポンス** | `{ videos: Array, pagination: { page, limit, total, totalPages } }` |
| **特記事項** | 公開済み動画のみ返却。タグはカンマ区切りで複数指定可。ソート順位：BCI（初心者向け度）が既定値 |

#### `/api/tags` - タグ一覧取得
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `GET` |
| **認証** | 不要（公開） |
| **機能** | 動画から抽出した全タグを頻度順ソート |
| **レスポンス** | `{ tags: [ "tag1", "tag2", ... ] }` |

#### `/api/paths` - 学習パス一覧取得
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `GET` |
| **認証** | 不要（公開） |
| **機能** | 公開済み学習パスの一覧取得、ステップ数カウント |
| **クエリパラメータ** | `page`, `limit` |
| **レスポンス** | `{ data: Array<{ ...path, stepCount }>, pagination: {...} }` |

#### `/api/feedback` - フィードバック投稿
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `POST` |
| **認証** | **必須**（セッション）|
| **機能** | 動画へのフィードバック投稿（問題報告） |
| **リクエストボディ** | `{ videoId, type (enum), comment? }` |
| **Type 値** | `"difficult"`, `"error"`, `"broken_link"`, `"outdated"` |
| **レスポンス** | `{ feedback: { id, videoId, type, comment, createdAt, resolved } }` (201) |
| **セキュリティ注記** | ✅ セッション認証あり。ユーザーID自動取得 |

#### `/api/feedback` - フィードバック取得（管理者向け）
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `GET` |
| **認証** | **管理者のみ** |
| **機能** | 全フィードバック取得、解決状況でフィルタ |
| **クエリパラメータ** | `resolved`(true/false) |
| **レスポンス** | `{ feedbacks: Array<{ ..., video: { id, title, channel } }> }` |

#### `/api/progress` - ユーザーの学習進捗取得
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `GET` |
| **認証** | **必須**（セッション） |
| **機能** | ユーザー個人の視聴/ブックマーク履歴取得 |
| **クエリパラメータ** | `page`, `limit` |
| **レスポンス** | `{ data: Array<{ ...progress, video: {...} }>, pagination }` |

#### `/api/progress` - 学習進捗更新（視聴/ブックマーク）
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `POST` |
| **認証** | **必須**（セッション） |
| **機能** | 動画の視聴済み/ブックマーク状態をUpsert |
| **リクエストボディ** | `{ videoId, watched?: boolean, bookmarked?: boolean }` |
| **レスポンス** | `{ progress: { userId, videoId, watched, bookmarked, ... } }` |

### 1.2 管理者API（`/api/admin/*`） - すべて adminHandler で認証・保護

#### `/api/admin/videos` - 全動画一覧（管理画面用）
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `GET` |
| **認証** | **管理者のみ** |
| **機能** | 全動画取得（公開/非公開問わず）、検索対応 |
| **クエリパラメータ** | `page`, `limit`(DEFAULT: 50), `q`(タイトル/チャンネル検索) |
| **レスポンス** | 動画一覧（JSON パース済み） |

#### `/api/admin/videos/[id]` - 動画詳細取得・更新・削除
| 項目 | 値 |
|------|-----|
| **PATCH** | **更新**：タイトル、難易度、スコア等をアップデート。自動BCI再計算 |
| **DELETE** | **削除**：動画を削除（カスケード削除） |
| **特記事項** | PATCH時に difficulty が変更された場合、BCI自動再計算。tags等のJSON配列対応 |

#### `/api/admin/videos/[id]/summarize` - トランスクリプト要約生成
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `POST` |
| **認証** | **管理者のみ** |
| **機能** | 動画のトランスクリプトをLLMで要約、メタデータ自動生成 |
| **リクエストボディ** | `{ transcript: string }` |
| **外部API** | Claude API または Dify Workflow |
| **生成内容** | `transcriptSummary`, `glossary`, `difficulty`, `deprecatedFlags`, `prerequisites`, `learnings` |
| **レスポンス** | `{ video: {...parsed}, llmResult: {...} }` |
| **BCI再計算** | 難易度自動更新に伴いBCI再計算 |

#### `/api/admin/paths` - 学習パス管理
| 項目 | 値 |
|------|-----|
| **GET** | 全学習パス一覧（ステップ詳細含む） |
| **POST** | 新規作成：タイトル、目標、ステップ配列を受け取り |
| **認証** | **管理者のみ** |

#### `/api/admin/paths/[id]` - 学習パス詳細・更新・削除
| 項目 | 値 |
|------|-----|
| **GET** | パス詳細取得（ステップ順序付き） |
| **PATCH** | フィールド/ステップ更新（トランザクション処理） |
| **DELETE** | パス削除 |

#### `/api/admin/feedback/[id]` - フィードバック解決状況更新
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `PATCH` |
| **認証** | **管理者のみ** |
| **リクエストボディ** | `{ resolved: boolean }` |
| **機能** | フィードバックを解決済みにマーク |

#### `/api/admin/bci-weights` - BCI重み設定
| 項目 | 値 |
|------|-----|
| **GET** | 現在のBCI重み取得 |
| **PUT** | 新しい重み保存（AppSetting に JSON 保存） |
| **重み項目** | shortDuration, hasCc, hasChapters, easyDifficulty, recentPublish, hasSampleCode, healthyLikeRatio |
| **値範囲** | 0-30 |

#### `/api/admin/bci-recalculate` - 全動画BCI再計算
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `POST` |
| **認証** | **管理者のみ** |
| **機能** | 全動画のBCIを現在の重みで一括再計算 |
| **レスポンス** | `{ updated: number, total: number }` |

#### `/api/admin/summarizer-settings` - 要約エンジン設定
| 項目 | 値 |
|------|-----|
| **GET** | 現在のアクティブプラグイン + 利用可能プラグイン一覧 |
| **PUT** | アクティブプラグイン切り替え（Claude / Dify） |
| **プラグイン情報** | key, name, configSchema |

#### `/api/admin/youtube-lookup` - YouTube メタデータ取得
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `POST` |
| **認証** | **管理者のみ** |
| **リクエストボディ** | `{ url: string }` |
| **機能** | YouTube Data API から動画メタデータ抽出（タイトル、チャンネル、所要時間等） |
| **外部API** | YouTube Data API v3 |
| **検出項目** | CC有無、チャプター有無、タグ、言語、所要時間 |

#### `/api/admin/users` - ユーザー統計
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `GET` |
| **認証** | **管理者のみ** |
| **機能** | 全ユーザーの視聴統計（総視聴時間、最近の視聴動画等） |
| **クエリパラメータ** | `page`, `limit` |
| **レスポンス** | `{ users: Array<{...user, watchedVideos, totalWatchMin, watchedCount}>, pagination }` |

#### `/api/import` - 動画一括インポート
| 項目 | 値 |
|------|-----|
| **HTTP メソッド** | `POST` |
| **認証** | **管理者のみ** |
| **機能** | YouTubeURL一覧から動画を一括作成・更新 |
| **リクエスト形式** | Array 直下 or `{ videos: Array }` 両対応 |
| **各動画フィールド** | url(必須), title, channel, language, durationMin, publishedAt, tags[], memo, rating(1-5) |
| **メタデータ自動補完** | YouTube APIで不足フィールド自動補完 |
| **BCI自動計算** | インポート時に即座にBCI算出 |
| **レスポンス** | `{ created, updated, skipped, total }` |
| **処理ロジック** | URLで重複排除 → YouTubeメタ取得 → BCI計算 → Upsert |

---

## 2. データベーススキーマ（Prisma）

### 2.1 モデル構成図

```
User 1---N Account
User 1---N Session
User 1---N UserProgress
User 1---N (via feedback indirectly)

Video 1---N PathStep
Video 1---N UserProgress
Video 1---N Feedback

Path 1---N PathStep
PathStep N---1 Video

AppSetting (キー・バリュー設定用)
VerificationToken (NextAuth用)
```

### 2.2 モデル詳細

#### **Video** (videos テーブル)
| フィールド | 型 | 特記事項 |
|-----------|-----|---------|
| `id` | String (CUID) | PK |
| `url` | String | UNIQUE インデックス |
| `title`, `channel` | String | 基本情報 |
| `language` | String | DEFAULT: "ja" |
| `durationMin` | Int | 動画の長さ（分） |
| `publishedAt` | DateTime | 公開日時 |
| `tags` | String | **JSON配列を文字列保存** |
| `hasCc`, `hasChapters`, `hasSampleCode` | Boolean | 特性フラグ |
| `sourceNotes` | String? | インポート時の注記 |
| `freshnessScore`, `qualityScore`, `likeRatio` | Float | スコア系（0-1） |
| `beginnerComfortIndex` | Int | **BCI（0-100）** |
| `transcriptSummary` | String? | LLMで生成した要約 |
| `glossary`, `deprecatedFlags`, `learnings` | String? | **JSON配列を文字列保存** |
| `prerequisites` | String? | 前提知識 |
| `difficulty` | String | "easy" \| "normal" \| "hard" |
| `isPublished` | Boolean | 公開フラグ |
| `createdAt`, `updatedAt` | DateTime | 管理日時 |
| **インデックス** | `@@index([isPublished, beginnerComfortIndex])` | BCI順フェッチ最適化 |
| | `@@index([isPublished, publishedAt])` | 最新順フェッチ最適化 |
| | `@@index([difficulty])` | 難易度フィルタ最適化 |

**JSON フィールドの注意点** ⚠️
- tags, glossary, deprecatedFlags, learnings は JSON 文字列として保存
- API応答時に `parseVideoJson()` で JSON パース
- 型安全性が低い（String型のため、Enum推奨）

#### **Path** (paths テーブル)
| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | String (CUID) | PK |
| `title`, `targetAudience`, `goal` | String | パスの基本情報 |
| `totalTimeEstimate` | Int | 推定学習時間（分） |
| `isPublished` | Boolean | 公開フラグ |
| `createdAt`, `updatedAt` | DateTime | 管理日時 |

#### **PathStep** (path_steps テーブル)
| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | String (CUID) | PK |
| `pathId`, `videoId` | String | FK |
| `order` | Int | ステップ順序 |
| `whyThis`, `checkpointQuestion` | String | 学習ガイド |
| **ユニーク制約** | `@@unique([pathId, order])` | 各パス内の順序は一意 |

#### **User** (users テーブル)
| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | String (CUID) | PK |
| `email` | String | UNIQUE |
| `name`, `image` | String? | プロフィール |
| `emailVerified` | DateTime? | NextAuth用 |
| `role` | String | **"user" \| "admin"** ⚠️ Enum推奨 |
| `createdAt` | DateTime | 作成日 |

#### **Account** (accounts テーブル) - NextAuth OAuth 用
| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id`, `userId`, `type`, `provider` | String | OAuth情報 |
| `providerAccountId`, `refresh_token`, `access_token` | String? | OAuth トークン |
| `expires_at`, `token_type`, `scope`, `id_token`, `session_state` | ? | トークン管理 |
| **ユニーク制約** | `@@unique([provider, providerAccountId])` | 同じOAuth提供者で一意 |

**命名不統一** ⚠️
- `refresh_token`, `access_token`, `session_state` は snake_case（他は camelCase）
- Prisma @map で対応するが、スキーマレベルで不統一

#### **Session** (sessions テーブル)
| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id`, `sessionToken` | String | セッション情報（UNIQUE） |
| `userId` | String | FK |
| `expires` | DateTime | セッション有効期限 |
| **注記** | JWT方式を採用するため、実際はJWT内のトークンで動作 |

#### **UserProgress** (user_progress テーブル)
| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | String (CUID) | PK |
| `userId`, `videoId` | String | FK（Composite key） |
| `watched`, `bookmarked` | Boolean | 状態フラグ |
| `createdAt`, `updatedAt` | DateTime | 管理日時 |
| **ユニーク制約** | `@@unique([userId, videoId])` | 1ユーザー1動画は1レコード |
| **インデックス** | `@@index([userId])` | ユーザーの進捗一覧フェッチ最適化 |

#### **Feedback** (feedbacks テーブル)
| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | String (CUID) | PK |
| `videoId`, `userId` | String? | FK（userId は任意） |
| `type` | String | **"difficult" \| "error" \| "broken_link" \| "outdated"** ⚠️ Enum推奨 |
| `comment` | String? | ユーザーコメント |
| `resolved` | Boolean | 解決済みフラグ |
| `createdAt` | DateTime | 報告日時 |
| **インデックス** | `@@index([videoId])` | 動画のフィードバック一覧最適化 |

#### **AppSetting** (app_settings テーブル) - 動的設定用
| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id`, `key` | String | key は UNIQUE |
| `value` | String | **JSON文字列で保存** ⚠️ 型安全性なし |
| `updatedAt` | DateTime | 更新日時 |
| **用途** | BCI重み、要約プラグイン設定等 |

#### **VerificationToken** (verification_tokens テーブル)
| フィールド | 型 | 説明 |
|-----------|-----|------|
| `identifier`, `token` | String | NextAuth 確認トークン |
| `expires` | DateTime | 有効期限 |

---

## 3. 認証・認可メカニズム

### 3.1 NextAuth 設定 (`src/lib/auth.ts`)

```typescript
// 認証方式
- JWT Strategy（credentials/OAuth両対応）
- Google OAuth（本番環境）
- Demo Credentials Provider（開発環境）

// JWT Callback
- user.id をトークンに埋め込み
- 追加データ: role（DBから取得）

// Session Callback
- トークンの id, role をセッションに追加
- セッションオブジェクト拡張
```

### 3.2 Role ベースアクセス制御

#### **isAdmin() ヘルパー関数**
```typescript
export async function isAdmin(session): Promise<boolean> {
  return session?.user?.role === "admin";
}
```

**実装パターン：**
1. **adminHandler ラッパー**（推奨）
   - すべての `/api/admin/*` で使用
   - 認証チェック + エラーハンドリング一括処理
   - 403 Forbidden または 500 エラーを返す

2. **手動チェック**（いくつかのエンドポイント）
   - `/api/feedback` GET
   - `/api/progress` GET/POST
   - getServerSession() → isAdmin() で都度確認

#### **セキュリティ評価**
- ✅ 強力: `/api/admin/*` は adminHandler で一元管理
- ⚠️ 改善提案: `/api/feedback` POST に認証チェックがある（良好）
- ⚠️ 改善提案: `/api/import` は adminHandler で統一（現在は直接チェック）

---

## 4. 外部API連携

### 4.1 YouTube Data API v3

**用途**: 動画メタデータ自動取得（インポート・ルックアップ機能）

#### **実装位置**: `src/lib/youtube.ts`

**主要関数:**

1. **extractVideoId(url: string)**
   - YouTube URLの複数形式に対応
   - `https://youtube.com/watch?v=XXX`
   - `https://youtu.be/XXX`
   - `https://www.youtube.com/embed/XXX`

2. **fetchVideoMeta(videoId: string)**
   - APIエンドポイント: `https://www.googleapis.com/youtube/v3/videos`
   - パラメータ: `snippet, contentDetails, captions`
   - 取得データ:
     - タイトル、チャンネル名
     - 所要時間（ISO 8601 形式をパース）
     - 言語（defaultLanguage / defaultAudioLanguage）
     - 公開日
     - タグ
     - クローズドキャプション有無
     - チャプター有無（説明欄のタイムスタンプ検出）

3. **parseISO8601Duration(duration)**
   - PT1H2M3S → 62 分に変換

4. **hasChapterTimestamps(description)**
   - 説明欄の "HH:MM:SS" パターン検出

**環境変数**: `YOUTUBE_API_KEY`

**エラーハンドリ**: APIキー未設定時は null 返却（graceful fallback）

### 4.2 Claude API（Anthropic）

**用途**: トランスクリプト→要約、メタデータ自動生成

#### **実装位置**: `src/lib/plugins/claude.ts`

**プラグイン方式:**
- Model: `claude-sonnet-4-20250514`（デフォルト、設定可能）
- Max tokens: 1024

**Prompt テンプレート**（日本語教育編集者）:
```
- 動画タイトル: ${videoTitle}
- 転写テキスト: ${transcript}

出力形式（JSON):
{
  "transcriptSummary": "要約（最大5文）",
  "prerequisites": "前提知識",
  "learnings": ["得られること1", "得られること2"],
  "difficulty": "easy | normal | hard",
  "deprecatedFlags": ["つまずき注意点"],
  "glossary": [{"term": "用語", "explain": "説明"}]
}
```

**応答処理:**
- バッククォートのJSONブロック対応
- JSON バリデーション（validateSummaryResult）
- エラー時フォールバック（デフォルト値返却）

**環境変数**: `ANTHROPIC_API_KEY`（未設定時は環境変数使用）

### 4.3 Dify Workflow

**用途**: Claude API の代替要約エンジン

#### **実装位置**: `src/lib/plugins/dify.ts`

**プラグイン方式:**
- エンドポイント: `/v1/workflows/run`
- 認証: `Authorization: Bearer ${apiKey}`

**入力:**
```javascript
{
  inputs: {
    video_title: string,
    transcript: string
  },
  response_mode: "blocking",
  user: "youtube-curation"
}
```

**出力解析:**
- 3つのパターンに対応：
  1. `data.outputs` - 直接オブジェクト
  2. `outputs` - JSON文字列
  3. `outputs.result` - JSON文字列

**環境変数**: Dify エンドポイント + API Key

---

## 5. 入力バリデーション（Zod）

### 5.1 Zod スキーマ構成

**位置**: `src/lib/validations.ts`

### 5.2 バリデーションスキーマ一覧

#### **Public APIs**

| スキーマ | 対象エンドポイント | 検証項目 |
|---------|------------------|---------|
| `feedbackCreateSchema` | POST /api/feedback | videoId(必須), type(enum), comment(max1000) |
| `progressUpsertSchema` | POST /api/progress | videoId(必須), watched?, bookmarked?(boolean) |
| `videosQuerySchema` | GET /api/videos | level, duration, language, tags, sort, q, page, limit |
| `pathsQuerySchema` | GET /api/paths | page, limit |
| `progressQuerySchema` | GET /api/progress | page, limit |

#### **Admin APIs**

| スキーマ | 対象エンドポイント | 検証項目 |
|---------|------------------|---------|
| `adminVideoUpdateSchema` | PATCH /api/admin/videos/[id] | title?, channel?, tags?(array/string), difficulty?, isPublished?, 他 |
| `pathCreateSchema` | POST /api/admin/paths | title(必須), targetAudience, goal, totalTimeEstimate, steps(配列) |
| `pathUpdateSchema` | PATCH /api/admin/paths/[id] | 上記の?版 |
| `feedbackResolveSchema` | PATCH /api/admin/feedback/[id] | resolved(boolean, 必須) |
| `summarizeSchema` | POST /api/admin/videos/[id]/summarize | transcript(必須) |
| `bciWeightsSchema` | PUT /api/admin/bci-weights | 7個の重み(0-30) |
| `summarizerSettingsSchema` | PUT /api/admin/summarizer-settings | activePlugin(必須), pluginConfigs? |
| `youtubeLookupSchema` | POST /api/admin/youtube-lookup | url(必須) |
| `importBodySchema` | POST /api/import | videos配列 or {videos} |

### 5.3 validateBody() ヘルパー

```typescript
export function validateBody<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; details: ZodIssue[] }
```

**使用パターン:**
```typescript
const validation = validateBody(schemaName, body);
if (!validation.success) {
  return NextResponse.json(
    { error: "Validation error", details: validation.details },
    { status: 400 }
  );
}
const data = validation.data; // 型安全
```

---

## 6. ビジネスロジック

### 6.1 BCI（Beginner Comfort Index）計算

#### **目的**: 初心者向け度を数値化（0-100）

#### **実装**: `src/lib/bci.ts`

#### **計算式**:
```
BCI = Σ(factor_weight × factor_value)

各要素（デフォルト重み）:
1. 短時間動画 (≤15分)           → +20点
   中程度 (15-30分)              → +10点
2. クローズドキャプション有      → +15点
3. チャプター有                  → +15点
4. 難易度が "easy"               → +20点
   難易度が "normal"             → +10点
5. 最近の公開 (2年以内)         → +10点
6. サンプルコード有              → +10点
7. 高い高評価比率 (≥0.9)        → +10点
   中程度 (≥0.8)                → +5点

最大値: 100（キャップ）
```

#### **BCI ラベル表示**:
- ≥ 70: "超入門に最適"（badge-beginner）
- ≥ 50: "入門OK"（badge-intro）
- < 50: ラベルなし

#### **BCI 重み管理**:
- デフォルト値（コード内）
- AppSetting テーブルで動的変更可能
- `/api/admin/bci-weights` で取得・変更
- `/api/admin/bci-recalculate` で全動画再計算

### 6.2 動画インポート処理（`/api/import`）

#### **フロー**:

```
1. 入力バリデーション（importBodySchema）
2. 配列形式の正規化（直下配列 or {videos}対応）
3. URL でハッシュテーブル作成（重複排除）
4. 各動画ごと:
   a) YouTubeメタデータ取得（不足フィールド補完）
   b) タイトル・所要時間がない場合はスキップ
   c) rating (1-5) → qualityScore (0-1) に変換
   d) rating → difficulty に自動判定
      rating ≤ 2 → "hard"
      rating ≤ 3 → "normal"
      rating > 3 → "easy"
   e) BCI 計算
5. Upsert（URL で既存判定）
   - 既存: UPDATE
   - 新規: CREATE
6. 結果返却 {created, updated, skipped, total}
```

#### **処理の特徴**:
- YouTube API呼び出しで遅延あり（APIキー未設定時は補完スキップ）
- rating から難易度推定（手動入力重視）
- メモフィールド → sourceNotes に保存

### 6.3 トランスクリプト要約生成（`/api/admin/videos/[id]/summarize`）

#### **フロー**:

```
1. 入力トランスクリプト受け取り
2. アクティブなサマライザープラグイン取得
3. generateVideoSummary() 呼び出し
   ↓ Claude / Dify API呼び出し
4. LLM からの応答：
   - transcriptSummary（5文以内）
   - prerequisites（前提知識）
   - learnings[]（得られる知識）
   - difficulty（自動判定）
   - deprecatedFlags[]（注意点）
   - glossary[]（用語集）
5. Video モデル更新:
   - transcriptSummary
   - glossary, deprecatedFlags, learnings（JSON化）
   - difficulty（上書き）
   - prerequisites
6. BCI 再計算（difficulty変更に伴い）
7. 更新結果 + LLM応答を返却
```

**エラーハンドリング**:
- LLM失敗時はデフォルト値返却（graceful fallback）
- JSON パースエラーもキャッチ

### 6.4 学習パス管理

#### **パス作成** (`POST /api/admin/paths`):
```typescript
{
  title: string,
  targetAudience: string,    // "初心者向け" など
  goal: string,              // "○○をマスターする" など
  totalTimeEstimate: number, // 合計分数
  isPublished: boolean,      // DEFAULT: true
  steps: [
    {
      videoId: string,
      order: number,         // 1, 2, 3...
      whyThis: string,       // "このステップが必要な理由"
      checkpointQuestion: string  // "ここまで理解した？"
    }
  ]
}
```

**ユニーク制約**: (pathId, order) - 同じパス内で順序は重複不可

#### **パス更新** (`PATCH /api/admin/paths/[id]`):
- フィールド部分更新
- ステップ指定時は全置き換え（トランザクション処理）

### 6.5 フィードバック管理

#### **構造**:
- type: "difficult" | "error" | "broken_link" | "outdated"
- 管理者が `PATCH /api/admin/feedback/[id]` で `resolved` フラグ

**セキュリティ**: 管理画面で未解決フィードバック一覧確認可

---

## 7. プラグインシステム（サマライザー）

### 7.1 アーキテクチャ

#### **ファイル構成**:
```
src/lib/plugins/
  ├── types.ts           # インターフェース定義
  ├── registry.ts        # プラグイン登録
  ├── claude.ts          # Claude API プラグイン
  ├── dify.ts            # Dify Workflow プラグイン
  ├── settings.ts        # 設定永続化
  └── validate.ts        # 出力バリデーション
```

### 7.2 SummarizerPlugin インターフェース

```typescript
interface SummarizerPlugin {
  readonly name: string;            // "Claude (Direct API)"
  readonly key: string;             // "claude"
  readonly configSchema: PluginConfigField[];
  summarize(input, config): Promise<LLMSummaryResult>;
}

// 設定フィールド（画面上で編集可能）
interface PluginConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "url";
  required: boolean;
  placeholder?: string;
}
```

### 7.3 プラグイン切り替え方法

1. **管理画面**から `/api/admin/summarizer-settings` PUT
2. **app_settings** テーブルに保存
   - key: "summarizer-config"
   - value: `{ activePlugin: "claude/dify", pluginConfigs: {...} }`
3. `/api/admin/videos/[id]/summarize` 実行時に自動選択

---

## 8. エラーハンドリング & 例外処理

### 8.1 パターン分類

#### **1. adminHandler ラッパー（推奨）**
```typescript
try {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return await handler(...args);
} catch (error) {
  console.error(errorMessage, error);
  return NextResponse.json({ error: errorMessage }, { status: 500 });
}
```

**利点**: 認証 + エラー処理一元化

#### **2. 手動try-catch**
```typescript
try {
  const body = await request.json();
  // ロジック
} catch (error) {
  console.error("エラーメッセージ:", error);
  return NextResponse.json(
    { error: "エラー時メッセージ" },
    { status: 500 }
  );
}
```

#### **3. バリデーションエラー**
```typescript
const validation = validateBody(schema, data);
if (!validation.success) {
  return NextResponse.json(
    { error: "Validation error", details: validation.details },
    { status: 400 }
  );
}
```

### 8.2 HTTP ステータスコード

| コード | 用途 |
|-------|------|
| 200 | OK（取得成功） |
| 201 | Created（作成成功） |
| 400 | Bad Request（バリデーション失敗） |
| 401 | Unauthorized（認証失敗） |
| 403 | Forbidden（管理者権限不要） |
| 404 | Not Found（リソース不存在） |
| 500 | Server Error（予期しないエラー） |

### 8.3 リスク評域と推奨改善

| 項目 | 現状 | リスク度 | 推奨 |
|------|------|---------|------|
| request.json() 例外 | try-catch あり | 低 | 現状で良好 |
| JSON パース失敗 | try-catchあり | 低 | OK |
| DB エラーメッセージ | 単純なエラー文字列 | 中 | ログ詳細化推奨 |
| API タイムアウト | 特にハンドリングなし | **中** | timeout設定追加推奨 |
| YouTube API 失敗 | graceful fallback | 低 | 良好 |

---

## 9. ページネーション実装

### 9.1 クエリパラメータ

```typescript
page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
limit = Math.min(
  PAGINATION.MAX_LIMIT,      // 100
  Math.max(1, parseInt(searchParams.get("limit") || DEFAULT_LIMIT, 10))
);
```

### 9.2 定数

```typescript
PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  ADMIN_VIDEOS_DEFAULT_LIMIT: 50,
  RECENT_WATCH_LIMIT: 20,
};
```

### 9.3 レスポンス形式

```typescript
{
  data: Array<T>,  // or videos, paths, feedbacks など
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: Math.ceil(total / limit)
  }
}
```

---

## 10. セキュリティ評価

### ✅ 優良点

1. **JWT + NextAuth**: 業界標準の認証実装
2. **adminHandler**: 管理者チェック一元化
3. **Zod バリデーション**: 型安全な入力検証
4. **SQL インジェクション防止**: Prisma ORM の使用
5. **CORS**: Next.js 設定（デフォルト） ✅

### ⚠️ 改善提案（優先度別）

#### **🔴 高優先度**

1. **エラーメッセージの情報漏洩**
   - DB エラーをそのまま返さない
   - 例: "user not found" は一般的なメッセージに

2. **入力サイズ制限**
   - transcript フィールド（最大容量なし）
   - tags/query 最大長チェック（現在: 200-500文字程度）

3. **Rate Limiting**
   - `/api/import` （大量インポート可能）
   - `/api/admin/bci-recalculate` （毎回全動画処理）

#### **🟡 中優先度**

1. **API タイムアウト**
   - YouTube API, Claude API 無制限待機
   - 例: 10秒タイムアウト設定推奨

2. **ログ出力**
   - console.error のみ
   - ログ集約サービス未統合

3. **環境変数バリデーション**
   - 起動時に必須キー存在確認なし
   - YOUTUBE_API_KEY, ANTHROPIC_API_KEY 未設定時は静かに失敗

#### **🟢 低優先度**

1. **セッション有効期限**
   - ハードコーディング不可（要確認）

2. **CSRF保護**
   - Next.js デフォルトで対応

---

## 11. パフォーマンス最適化

### 11.1 インデックス戦略

```prisma
Video {
  @@index([isPublished, beginnerComfortIndex])  // BCI順フェッチ
  @@index([isPublished, publishedAt])           // 最新順フェッチ
  @@index([difficulty])                        // 難易度フィルタ
}

UserProgress {
  @@index([userId])                           // ユーザー進捗一覧
  @@unique([userId, videoId])                 // 重複防止
}

Feedback {
  @@index([videoId])                          // 動画フィードバック一覧
}
```

### 11.2 大量データ処理

**BCI再計算** (`/api/admin/bci-recalculate`):
```typescript
// トランザクション一括更新で効率化
await prisma.$transaction(
  updates.map(u =>
    prisma.video.update({ where: { id: u.id }, data: {...} })
  )
);
```

**ユーザー統計** (`/api/admin/users`):
```typescript
// include で関連データ一括取得（N+1回避）
include: {
  progress: {...include: {video: {...}}},
  _count: {select: {progress: true}}
}
```

### 11.3 キャッシング戦略

**現状**: キャッシング機構なし

**推奨**:
- `/api/tags` → Redis で24h キャッシュ
- `/api/paths` → 更新時だけ無効化
- BCI重み → メモリキャッシュ

---

## 12. データの流れ（End-to-End）

### 12.1 動画インポート フロー

```
管理画面 (ImportForm)
  ↓
POST /api/import
  ↓ adminHandler （認証チェック）
  ↓ Zod バリデーション
  ↓ URL重複排除
  ↓ YouTube API メタデータ取得
  ↓ rating → difficulty 変換
  ↓ BCI 計算
  ↓ Prisma.upsert()
  ↓
{ created: N, updated: M, skipped: K }
```

### 12.2 動画表示 フロー

```
ユーザー（フロントエンド）
  ↓
GET /api/videos?level=beginner&sort=bci&page=1
  ↓ Zod クエリ バリデーション
  ↓ Prisma.findMany() （WHERE + ORDER BY + LIMIT）
  ↓ parseVideoJson() （JSON 展開）
  ↓
{ videos: [{id, title, bci, ...parsed}], pagination: {...} }
```

### 12.3 要約生成 フロー

```
管理画面 (管理者)
  ↓
POST /api/admin/videos/[id]/summarize
  {transcript: "..."}
  ↓ adminHandler
  ↓ validateBody（summarizeSchema）
  ↓ getSummarizerConfig()
  ↓ getPlugin(activePlugin) → Claude or Dify
  ↓ plugin.summarize({videoTitle, transcript}, config)
    ↓ Claude API / Dify API 呼び出し
    ↓ JSON パース & validateSummaryResult
  ↓ Prisma.update() （transcriptSummary, glossary, 他）
  ↓ calculateBCI() （difficulty 更新に伴い）
  ↓
{ video: {...updated}, llmResult: {...} }
```

---

## 13. 既知の問題と技術負債

### 13.1 型安全性の問題

| 項目 | 問題 | 影響度 | 修正難度 |
|------|------|--------|---------|
| Video.tags (String) | JSON 文字列型チェックなし | 中 | 易 |
| Feedback.type (String) | Enum にすべき | 中 | 易 |
| User.role (String) | Enum にすべき | 中 | 易 |
| AppSetting.value (String) | 型チェックなし | 高 | 易 |

### 13.2 スキーマ設計上の課題

| 項目 | 問題 | 推奨 |
|------|------|------|
| Account 命名不統一 | snake_case 混在 | 全て snake_case に統一 |
| Account userId インデックス | 不足 | `@@index([userId])` 追加 |
| Video prerequisites (String) | JSON ではなく単純文字列 | OK（現在の設計で問題なし） |
| Feedback userId (nullable) | 匿名フィードバック許可 | 仕様確認推奨 |

### 13.3 コード重複

**ページネーション処理**:
- `/api/videos`, `/api/admin/videos`, `/api/progress`, `/api/paths`, `/api/admin/users` で重複
- 推奨: ヘルパー関数化

**クエリ バリデーション**:
- page/limit の Math.max/Math.min パターン繰り返し
- 推奨: ユーティリティ関数化

**エラーハンドリング**:
- 各エンドポイント try-catch パターン繰り返し
- adminHandler で統一済み（継続推奨）

---

## 14. テスト体系（該当箇所）

### 14.1 テスト対象ファイル（既存）

- `src/app/api/videos/route.test.ts`
- `src/app/api/admin/bci-weights/route.test.ts`
- `src/app/api/admin/bci-recalculate/route.test.ts`
- `src/lib/plugins/*.test.ts`
- 他複数

### 14.2 テストカバレッジ

**推奨アプローチ**:
- BCI計算ロジック: 単体テスト（境界値テスト）
- API エンドポイント: 統合テスト（認証・バリデーション含む）
- プラグイン: Mock API テスト

---

## 15. 設定・環境変数サマリー

### 必須環境変数
| キー | 用途 | 備考 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL | 必須 |
| `DIRECT_URL` | DB ダイレクト接続 | 必須（Prisma） |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth | 本番環境 |
| `YOUTUBE_API_KEY` | YouTube Data API v3 | オプション（未設定時フォールバック） |
| `ANTHROPIC_API_KEY` | Claude API | オプション（DifyまたはPlugin設定で可） |
| `NEXTAUTH_SECRET` | NextAuth JWT 署名 | 必須（本番環境） |
| `NEXTAUTH_URL` | NextAuth コールバック URL | 本番環境 |

---

## 16. まとめと推奨事項

### 16.1 全体評価

✅ **優良点**:
- NextAuth + Prisma の標準的で堅い実装
- adminHandler による認証・エラーハンドリング一元化
- プラグインシステムで柔軟なLLM統合
- Zod による型安全なバリデーション

⚠️ **改善推奨**（優先度順）:
1. **型安全性向上**: Enum 型の導入（role, feedback type, difficulty等）
2. **エラーハンドリング統一**: すべてのAPIで一貫したエラーフォーマット
3. **セキュリティ強化**: Rate limiting, タイムアウト, ログ集約
4. **コード重複削減**: ページネーション・バリデーションのヘルパー関数化
5. **パフォーマンス**: キャッシング戦略の実装

### 16.2 アーキテクチャの決定パターン

**採用パターン**:
- MVC（Model = Prisma, View = React, Controller = API Routes）
- Plugin Pattern（サマライザー切り替え可能）
- Middleware Pattern（adminHandler ラッパー）

**今後のスケーリング方針**:
- サービス分割: 動画管理サービス、ユーザー管理サービス
- キャッシング層: Redis の導入
- 非同期処理: Bull キューの検討（大量インポート等）

---

**レポート完了日**: 2026-02-22
