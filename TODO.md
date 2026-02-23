# 残タスク一覧

## 必須（デプロイ前の手動設定）

- [ ] **Supabase セットアップ**
  - supabase.com でプロジェクト作成
  - `.env` の `DATABASE_URL`（ポート6543）と `DIRECT_URL`（ポート5432）を設定
  - `npx prisma migrate dev --name init` でテーブル作成
  - `npx prisma db seed` でサンプルデータ投入（任意）

- [ ] **本番用 NEXTAUTH_SECRET 生成**
  - `openssl rand -base64 32` で生成し `.env` に設定

- [ ] **Google OAuth クライアント作成**
  - Google Cloud Console で OAuth 2.0 クライアントを作成
  - Authorized redirect URI: `https://<本番ドメイン>/api/auth/callback/google`
  - `.env` に `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET` を設定
  - ※ 未設定でもデモログイン（demo@example.com / admin@example.com）で動作する

- [ ] **Dify ワークフロー構築**
  - 入力変数: `video_title` (String), `transcript` (String)
  - 出力: JSON（transcriptSummary, glossary, difficulty, deprecatedFlags, prerequisites, learnings）
  - 管理画面の「要約設定」タブから endpoint と apiKey を設定

- [ ] **管理者ユーザー設定**
  - seed 実行で `admin@example.com (role=admin)` が作成される
  - 本番では Google OAuth ログイン後、Supabase Dashboard で User テーブルの `role` を `"admin"` に変更

## 推奨（品質向上）

- [ ] **error.tsx / not-found.tsx 作成** — グローバルエラー・404 画面
- [ ] **FilterSidebar のタグを DB 動的取得に変更** — 現在 10 件ハードコード（`src/components/ui/FilterSidebar.tsx`）
- [ ] **admin paths/[id] のルートテスト追加** — 現在テストファイルなし
- [ ] **seed.ts に prerequisites / learnings のサンプルデータ追加** — 新フィールド分
- [ ] **Vercel デプロイ設定** — 環境変数設定ガイド、`NEXTAUTH_URL` を本番ドメインに変更

## オプション（将来フェーズ）

- [ ] YouTube 字幕 API 連携（転写テキスト自動取得、現在は手動貼り付け）
- [ ] 全文検索エンジン導入（Typesense / Meilisearch）
- [ ] クイズ自動生成（LLM で理解度チェック問題生成）
- [ ] KPI 分析ダッシュボード（初回視聴時間、パス完了率、離脱率）
- [ ] i18n 対応（UI 多言語化）
- [ ] 課金・Freemium モデル（Stripe 等）
