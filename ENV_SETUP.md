# 環境変数セットアップガイド

## 1. `DATABASE_URL` / `DIRECT_URL`（必須）

### Supabase プロジェクト作成

1. [supabase.com](https://supabase.com) にアクセスし、GitHub アカウントでログイン
2. **Dashboard** → **New Project**
3. 以下を入力：
   - **Organization**: 自分の org を選択（初回は自動作成される）
   - **Project name**: 任意（例: `youtube-curation`）
   - **Database Password**: 強力なパスワードを設定 → **必ず控えておく**
   - **Region**: `Northeast Asia (Tokyo)` を選択
4. **Create new project** をクリック（作成に2分ほどかかる）

### 接続文字列の取得

5. プロジェクトが作成されたら、ダッシュボード上部の **「Connect」ボタン** をクリック
6. 接続方法の選択画面が表示される

**`DATABASE_URL` の取得（Transaction Pooler）:**

7. **Transaction Pooler** セクションの接続文字列をコピー（ポート `6543`）
8. `[YOUR-PASSWORD]` を手順3のパスワードに置換

```
DATABASE_URL="postgresql://postgres.xxxxxxxx:パスワード@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
```

**`DIRECT_URL` の取得（Direct Connection または Session Pooler）:**

9. **Session Pooler**（ポート `5432`）または **Direct Connection**（ポート `5432`）の接続文字列をコピー
10. 同様にパスワードを置換

```
DIRECT_URL="postgresql://postgres.xxxxxxxx:パスワード@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

> **補足**: 接続プールの詳細設定は、左サイドバー **⚙ Project Settings** → **Database** → **Connection Pooling** から変更できます。

### DB初期化（`.env` 設定後にターミナルで実行）

```bash
cd /mnt/c/Users/s.soga/test/youtube-curation

# テーブル作成
npx prisma migrate dev --name init

# サンプルデータ投入（任意）
npx tsx prisma/seed.ts
```

---

## 2. `NEXTAUTH_SECRET`（必須）

ターミナルで以下を実行：

```bash
openssl rand -base64 32
```

出力例: `K7xQ3p2m+...`（ランダムな44文字程度の文字列）

これをそのまま `.env` に設定：

```
NEXTAUTH_SECRET="出力された文字列"
```

---

## 3. `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`（任意）

### Google Cloud プロジェクト作成

1. [console.cloud.google.com](https://console.cloud.google.com) にログイン
2. 上部のプロジェクト選択 → **新しいプロジェクト** → 名前を入力 → **作成**

### OAuth 同意画面の設定

3. 左メニュー **APIとサービス** → **OAuth 同意画面**
4. **User Type**: `外部` → **作成**
5. 以下を入力して保存：
   - **アプリ名**: 任意（例: `YouTube Curation`）
   - **ユーザーサポートメール**: 自分のメール
   - **デベロッパーの連絡先情報**: 自分のメール
6. **スコープ** → 何も追加せず **保存して次へ**
7. **テストユーザー** → ログインさせたいGoogleアカウントのメールを追加 → **保存して次へ**

### OAuth クライアント ID の作成

8. 左メニュー **認証情報** → **＋認証情報を作成** → **OAuth クライアント ID**
9. 以下を設定：
   - **アプリケーションの種類**: `ウェブ アプリケーション`
   - **名前**: 任意（例: `youtube-curation`）
   - **承認済みの JavaScript 生成元**: `http://localhost:3010`
   - **承認済みのリダイレクト URI**:
     - `http://localhost:3010/api/auth/callback/google`（ローカル用）
     - `https://本番ドメイン/api/auth/callback/google`（本番用、後で追加可）
10. **作成** をクリック
11. 表示されるダイアログから値をコピー：

```
GOOGLE_CLIENT_ID="123456789-xxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxx"
```

> 未設定でも `demo@example.com` / `admin@example.com` でデモログインできます。

---

## 4. `YOUTUBE_API_KEY`（任意）

### API の有効化

1. [console.cloud.google.com](https://console.cloud.google.com) で上記と同じプロジェクトを選択
2. 左メニュー **APIとサービス** → **ライブラリ**
3. 検索欄に `YouTube Data API v3` と入力
4. 検索結果の **YouTube Data API v3** をクリック → **有効にする**

### API キーの作成

5. 左メニュー **認証情報** → **＋認証情報を作成** → **API キー**
6. 作成されたキーが表示される → コピー
7. （推奨）**キーを制限** をクリック：
   - **API の制限** → **キーを制限** → `YouTube Data API v3` のみ選択
   - **保存**

```
YOUTUBE_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

> 未設定でもインポート自体は動作します。YouTube URLからのタイトル・チャンネル自動入力が無効になるだけです。

---

## 5. `ANTHROPIC_API_KEY`（通常は不要）

1. [console.anthropic.com](https://console.anthropic.com) にログイン
2. 左メニュー **API Keys**
3. **Create Key** → 名前を入力 → **Create**
4. 表示されたキーをコピー（この画面でしか表示されないので注意）

```
ANTHROPIC_API_KEY="sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

> Dify プラグインで要約を行う設計のため、通常は設定不要です。

---

## 6. Dify `endpoint` / `apiKey`（管理画面UIから設定）

### ワークフロー作成

1. [cloud.dify.ai](https://cloud.dify.ai) にログイン（または自前ホスト）
2. **スタジオ** → **ワークフローを作成**
3. 入力変数を定義：
   - `video_title`（String）
   - `transcript`（String）
4. LLMノードを追加し、要約・用語集・難易度等を出力するプロンプトを設定
5. 出力を JSON 形式に整形するコード変換ノードを追加
6. **公開** ボタンでワークフローを公開

### 接続情報の取得

7. 左メニュー **APIアクセス**（または右上の **API Reference**）
8. 以下の2つを確認：
   - **API Base URL**: `https://api.dify.ai/v1`
   - **API Secret Key**: `app-xxxxxxxxxxxxxxxx`

### アプリへの設定

9. アプリの **管理画面** → **要約設定** タブを開く
10. **プラグイン**: `Dify Workflow` を選択
11. 上記の **endpoint** と **apiKey** を入力して **保存**

> `.env` ファイルではなく、管理画面のUIから設定します。設定値はDBの `app_settings` テーブルに保存されます。

---

## まとめ

| 変数 | 必須 | 取得先 |
|------|------|--------|
| `DATABASE_URL` / `DIRECT_URL` | 必須 | Supabase Dashboard |
| `NEXTAUTH_SECRET` | 必須 | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `SECRET` | 任意 | Google Cloud Console |
| `YOUTUBE_API_KEY` | 任意 | Google Cloud Console |
| `ANTHROPIC_API_KEY` | 任意 | Anthropic Console |
| Dify endpoint / apiKey | 必須 | Dify Dashboard → 管理画面UIで設定 |
