# プロジェクト品質分析レポート

4つの観点（セキュリティ・パフォーマンス・コード品質・UX）から分析した結果をまとめる。

---

## 1. セキュリティ・脆弱性

### Critical（即座対応）

| # | 問題 | 影響 | 改善案 |
|---|------|------|--------|
| S-1 | `NEXTAUTH_SECRET` が開発用固定値のまま | JWTトークンの偽造が可能 | `openssl rand -base64 32` で生成し `.env` に設定 |
| S-2 | プラグイン設定のAPIキーがDB（AppSetting）に平文保存 | DB漏洩時にAPIキーが露出 | 暗号化して保存、復号は読み出し時のみ |
| S-3 | `POST /api/feedback` が未認証で投稿可能 | スパム・DoS攻撃のリスク | Rate Limiting 導入、または認証必須化 |
| S-4 | Next.js に既知の高深刻度 DoS 脆弱性 | サービス停止のリスク | `next` パッケージのアップグレード |

### High（早期対応）

| # | 問題 | 影響 | 改善案 |
|---|------|------|--------|
| S-5 | Demo Credentials Provider が本番でも有効 | 誰でも任意メールでログイン可能 | `NODE_ENV === "production"` で無効化 |
| S-6 | APIルートの入力バリデーション不足 | 不正データの投入リスク | zod 等でリクエストボディをスキーマ検証 |
| S-7 | Rate Limiting 未実装（全エンドポイント） | API連打によるリソース枯渇 | `next-rate-limit` やVercel Edge Middleware で制限 |

### Medium

| # | 問題 | 影響 | 改善案 |
|---|------|------|--------|
| S-8 | CSRF 対策が Next.js デフォルト依存 | クロスサイトリクエスト偽造のリスク | CSRFトークンの明示的実装を検討 |
| S-9 | CORS 設定が明示されていない | 意図しないオリジンからのアクセス | `next.config.js` で許可オリジンを明示 |
| S-10 | エラーレスポンスに内部情報が含まれる可能性 | スタックトレース等の漏洩 | 本番ではジェネリックなエラーメッセージのみ返却 |

---

## 2. パフォーマンス・スケーラビリティ

### 影響度: 高

| # | 問題 | 現状 | 改善案 |
|---|------|------|--------|
| P-1 | DBインデックス定義なし | `prisma/schema.prisma` にインデックスが未定義。全クエリがフルテーブルスキャン | `@@index` を追加: `isPublished`, `difficulty`, `publishedAt`, `durationMin`, `beginnerComfortIndex` |
| P-2 | N+1クエリ問題 | `/api/videos/[id]` で動画取得後に別クエリで関連動画検索。`/api/admin/users` で全ユーザー＋全視聴動画を展開 | include の最適化、件数制限の追加 |
| P-3 | キャッシュ戦略なし | `force-dynamic` が多用。Cache-Control ヘッダ未設定 | 公開データは ISR 化（`revalidate=3600`）、ユーザー固有データのみ `force-dynamic` |
| P-4 | 検索入力の即座フェッチ | `/videos` でキー入力のたびにAPI呼び出し | debounce（300-500ms）を実装 |

### 影響度: 中

| # | 問題 | 現状 | 改善案 |
|---|------|------|--------|
| P-5 | React最適化不足 | `React.memo`, `useMemo`, `useCallback` の活用不足。VideoCard等が不要な再レンダリング | メモ化の適用 |
| P-6 | dynamic import 未使用 | 管理画面の全タブコンポーネントが初回ロードで読み込まれる | `next/dynamic` で遅延読み込み |
| P-7 | ページネーション未実装のエンドポイント | `/api/paths`, `/api/progress` に件数制限なし | `skip` / `take` パラメータを追加 |
| P-8 | JSON文字列フィールドの検索非効率 | `tags` が JSON 文字列で `contains` 検索 | タグの正規化テーブル化を検討 |

---

## 3. コード品質・保守性

### 重要度: 高

| # | 問題 | 箇所 | 改善案 |
|---|------|------|--------|
| Q-1 | `as any` が11箇所（本体コード） | `admin/page.tsx:75,89`, `Header.tsx`, `auth.ts` で `(session.user as any).role` | NextAuth の Session 型を拡張して `role` フィールドを正式に定義 |
| Q-2 | `as any` が50箇所（テストコード） | 全テストファイルの `(await parseJson(res)) as any` | `parseJson` をジェネリック化: `parseJson<T>()` |
| Q-3 | 認証ボイラープレート重複 | 13個の Admin API で同じ `getServerSession` + `isAdmin` チェック | `withAdminAuth()` 高階関数で統一 |
| Q-4 | エラーハンドリング重複 | 全 Admin API で同じ try-catch + console.error + 500レスポンス | `withErrorHandling()` ラッパーで統一 |
| Q-5 | Silent catch（空の catch ブロック） | `admin/page.tsx:67`, `PathManager.tsx:84,98,269`, `StepTimeline.tsx:112,122`, `FeedbackButton.tsx:60` | ログ出力 + ユーザーへのエラーフィードバック追加 |
| Q-6 | テスト未作成のAPIルート | `src/app/api/admin/paths/[id]/route.ts`（PATCH/DELETE）, `src/app/api/auth/[...nextauth]/route.ts` | テストファイル作成 |

### 重要度: 中

| # | 問題 | 箇所 | 改善案 |
|---|------|------|--------|
| Q-7 | APIクライアント層の不在 | 各コンポーネントで直接 `fetch()` を呼び出し | `lib/api-client.ts` に共通関数を集約 |
| Q-8 | Fat Component | `PathManager.tsx`（661行）, `ImportForm.tsx`（401行）, `VideoTable.tsx`（300行） | カスタムフック抽出、サブコンポーネント分割 |
| Q-9 | ハードコード値（マジックナンバー） | `limit: 100, 20, 12`（ページング）, `70, 50`（BCIラベル閾値）, `15, 30`（動画長閾値分）, `0.9, 0.8`（高評価率） | 定数ファイル `lib/constants.ts` に抽出 |
| Q-10 | ローカル重複コンポーネント | `VideoTable.tsx` 内のローカル `BCIBadge` が `components/video/BCIBadge.tsx` と重複 | 共有版を import して使用 |

### 重要度: 低

| # | 問題 | 箇所 | 改善案 |
|---|------|------|--------|
| Q-11 | 命名規則（軽微） | `bci-weights.ts` が kebab-case（他は camelCase） | TypeScript慣例では問題なし。統一するなら rename |

---

## 4. UX・アクセシビリティ

### 影響度: 高

| # | 問題 | 現状 | 改善案 |
|---|------|------|--------|
| U-1 | error.tsx 未実装 | API エラーやランタイムエラー時に Next.js デフォルトのエラー画面が表示される | `src/app/error.tsx` を作成。リトライボタン付きのフレンドリーなエラー画面 |
| U-2 | not-found.tsx 未実装 | 存在しないURLで Next.js デフォルトの 404 画面 | `src/app/not-found.tsx` を作成。ホームへの導線付き |
| U-3 | トースト通知なし | 操作成功/失敗時に `alert()` を使用、または何も表示しない（silent） | トーストコンポーネント導入（react-hot-toast 等） |
| U-4 | aria 属性未実装 | ボタン・フォーム・モーダルに `aria-label`, `aria-expanded`, `role` 等がない | セマンティックHTML + aria 属性を追加 |
| U-5 | キーボードナビゲーション未対応 | モーダル・ドロップダウンで Escape キー、Tab キーの操作不可 | `onKeyDown` ハンドラ、フォーカストラップ実装 |

### 影響度: 中

| # | 問題 | 現状 | 改善案 |
|---|------|------|--------|
| U-6 | loading.tsx 未実装 | ページ遷移時にローディング表示なし | `src/app/loading.tsx` を作成。Suspense boundary |
| U-7 | スケルトンUI なし | データ取得中は Loader2 スピナーのみ | コンテンツの形状に合わせたスケルトンコンポーネント |
| U-8 | 管理画面のモバイル対応不足 | テーブル・タブが小画面で崩れる | レスポンシブテーブル（横スクロール or カード表示切替） |
| U-9 | 一括操作機能なし（管理画面） | 動画の公開/非公開/削除が1件ずつのみ | チェックボックス選択 + 一括アクション |
| U-10 | 空状態（empty state）の不統一 | 一部でテキストのみ、一部で未対応 | イラスト/アイコン付きの統一 empty state コンポーネント |

---

## 改善ロードマップ

### Phase 1: 即座対応（1-2日）

- [ ] `NEXTAUTH_SECRET` 本番用に変更（S-1）
- [ ] DBインデックス追加（P-1）
- [ ] 検索 debounce 実装（P-4）
- [ ] `next` パッケージアップグレード（S-4）

### Phase 2: 短期対応（1-2週間）

- [ ] `error.tsx` / `not-found.tsx` 作成（U-1, U-2）
- [ ] トースト通知システム導入（U-3）
- [ ] NextAuth Session 型拡張 → `as any` 削除（Q-1）
- [ ] `parseJson` ジェネリック化（Q-2）
- [ ] Demo Provider の本番無効化（S-5）
- [ ] Silent catch にログ + フィードバック追加（Q-5）
- [ ] `admin/paths/[id]` テスト作成（Q-6）

### Phase 3: 中期対応（2-4週間）

- [ ] `withAdminAuth()` / `withErrorHandling()` で認証・エラー処理統一（Q-3, Q-4）
- [ ] Fat Component 分割: PathManager, ImportForm（Q-8）
- [ ] Rate Limiting 導入（S-7）
- [ ] キャッシュ戦略: ISR 化 + Cache-Control ヘッダ（P-3）
- [ ] React.memo / useMemo 最適化（P-5）
- [ ] dynamic import でタブ遅延読み込み（P-6）
- [ ] ハードコード値を定数化（Q-9）

### Phase 4: 長期対応（1ヶ月以上）

- [ ] APIキー暗号化保存（S-2）
- [ ] 入力バリデーション（zod）導入（S-6）
- [ ] aria 属性 / キーボードナビゲーション対応（U-4, U-5）
- [ ] 管理画面モバイル対応（U-8）
- [ ] 一括操作機能（U-9）
- [ ] ページネーション統一（P-7）
- [ ] タグの正規化テーブル化（P-8）
