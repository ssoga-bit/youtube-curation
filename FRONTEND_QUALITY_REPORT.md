# フロントエンドコード品質調査レポート

調査日時: 2026-02-21
調査対象: `src/components/` および `src/app/` 配下のすべての TypeScript/React コンポーネント

---

## 🔴 高重要度の問題（修正推奨）

### 1. **アクセシビリティ: 画像の alt 属性が空文字列**
- **ファイル**: `src/components/layout/Header.tsx`
- **行番号**: 43-47行目（デスクトップ）、101-106行目（モバイル）
- **問題**: ユーザーのプロフィール画像が表示されないときのために、`alt=""` として空文字列が設定されている
- **影響度**: 高 - スクリーンリーダーユーザーが画像の内容を理解できない
- **改善提案**:
  ```tsx
  // 現在:
  <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />

  // 改善後:
  <img src={session.user.image} alt={`${session.user.name || session.user.email}のプロフィール画像`} className="w-7 h-7 rounded-full" />
  ```

### 2. **アクセシビリティ: aria-label 属性の欠落（複数箇所）**
- **ファイル**:
  - `src/components/ui/FilterSidebar.tsx` (70行目) - モバイルメニュー閉じるボタン
  - `src/components/path/StepTimeline.tsx` (157-166行目) - ステップ完了ボタン
- **問題**: アイコンのみのボタンに対して `aria-label` が設定されていない
- **改善提案**:
  ```tsx
  // FilterSidebar.tsx 70行目:
  <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded" aria-label="フィルターを閉じる">

  // StepTimeline.tsx 157-166行目:
  <button
    onClick={() => toggleStep(step.id, step.video.id)}
    className="..."
    aria-label={isDone ? "完了済みにマーク" : "完了にマーク"}
  >
  ```

### 3. **セキュリティ: ユーザー入力のXSS対策不足（潜在的リスク）**
- **ファイル**:
  - `src/app/videos/[id]/page.tsx` (242-244行目) - 要点サマリ
  - `src/components/path/StepTimeline.tsx` (220行目 "なぜこの動画？")
- **問題**: `whitespace-pre-wrap` を使用してテキストを表示している場合、サーバー側で適切なサニタイズが必要
- **改善提案**: サーバー側の API レスポンスで確実に HTML エスケープされていることを確認し、必要に応じて `DOMPurify` などのライブラリを使用

---

## 🟡 中重要度の問題（改善推奨）

### 1. **TypeScript: memo と命名export の組み合わせ**
- **ファイル**:
  - `src/components/video/VideoCard.tsx` (18行目)
  - `src/components/path/PathCard.tsx` (23行目)
  - `src/components/ui/EmptyState.tsx` (10行目)
  - `src/components/video/BCIBadge.tsx` (11, 29行目)
- **問題**: `memo(function Name { ... })` パターンを使用しているが、eslint ルールとして `react/display-name` の除外が必要な場合がある
- **影響度**: パフォーマンスにはほぼ影響なしだが、React DevTools でのデバッグが若干困難
- **改善提案**:
  ```tsx
  // 現在:
  export const VideoCard = memo(function VideoCard({ video }: VideoCardProps) { ... });

  // 改善後:
  function VideoCard({ video }: VideoCardProps) { ... }
  export const VideoCard = memo(VideoCard);
  ```

### 2. **React パフォーマンス: useCallback 依存配列の最適化**
- **ファイル**: `src/app/videos/page.tsx` (73-83行目)
- **問題**: `buildParams` 関数が多くの依存変数を持つため、再作成される頻度が多い
- **影響度**: 中 - API 呼び出しが不要に発火する可能性
- **改善提案**: 依存配列を最小化し、不要な再計算を防ぐ

### 3. **フォーム設計: aria-label の欠落（複数フォーム要素）**
- **ファイル**:
  - `src/components/ui/FilterSidebar.tsx` (85-95行目) - ラジオボタン
  - `src/components/admin/path/PathForm.tsx` (40-46行目) - キャンセルボタン（視覚的には「キャンセル」と表記があるが、aria-label がないと不完全）
- **影響度**: 中 - スクリーンリーダーの読み上げが不完全
- **改善提案**: すべてのフォーム要素に適切な `aria-label` または `aria-labelledby` を設定

### 4. **Unicode エスケープシーケンスの過度な使用（可読性問題）**
- **ファイル**:
  - `src/components/admin/FeedbackList.tsx` (10-15行目、72-74行目、100行目ほか)
  - `src/components/video/FeedbackButton.tsx` (10-14行目、74行目ほか)
- **問題**: 日本語が Unicode エスケープシーケンスで記述されている（例: `\u96E3\u3057\u304B\u3063\u305F` = "難しかった"）
- **影響度**: 低 - 機能的な問題ではないが、可読性が大幅に低下
- **改善提案**: 直接 UTF-8 で記述
  ```tsx
  // 現在:
  const TYPE_LABELS: Record<string, string> = {
    difficult: "\u{1F635} \u96E3\u3057\u304B\u3063\u305F",
  };

  // 改善後:
  const TYPE_LABELS: Record<string, string> = {
    difficult: "😵 難しかった",
  };
  ```

### 5. **state 管理: loading 状態の分散**
- **ファイル**: `src/components/admin/VideoTable.tsx` (49行目)
- **問題**: 複数の `useState` で複数のロード状態を管理している（`loading`、`editingId`、`deletingId`など）
- **影響度**: 中 - コードの複雑性が増す可能性、バグのリスク増加
- **改善提案**: `useReducer` を使用して状態を統合するか、状態管理ライブラリの導入を検討

### 6. **セマンティックHTML: 欠落した構造化マークアップ**
- **ファイル**: `src/components/ui/FilterSidebar.tsx` (58-164行目)
- **問題**: `aside` 要素にラベルやタイトルがない場合、その目的が明確でない可能性
- **改善提案**: `aria-labelledby` を使用してセクションにラベルを付与

---

## 🟢 低重要度の問題（参考情報）

### 1. **TypeScript 型安全性: any型の使用はなし（良好）**
- 全体的に型が適切に定義されている
- ただし `useParams<{ id: string }>()` など、動的ルートパラメータの型定義は改善可能

### 2. **useEffect の依存配列: 複数の複雑な依存**
- **ファイル**: `src/app/videos/page.tsx` (105行目)
- **問題**: `buildParams` を依存配列に含めることで、不要な再実行が増える可能性
- **改善提案**: `useCallback` でメモ化し、本当に必要な値のみ依存配列に含める

### 3. **key prop の使用: インデックスを key に使用**
- **ファイル**: `src/app/videos/page.tsx` (179-191行目)
- **問題**: 読み込み中のスケルトンに `key={i}` を使用しているが、リスト内容が変わらないため問題なし

### 4. **ダイナミックインポート: 現在の実装は良好**
- **ファイル**: `src/app/admin/page.tsx` (30-57行目)
- **評価**: `loading` コンポーネントを指定し、ローディングUI を表示している。フォールバック処理も良好

---

## ✅ 良好な実装例

### 1. **アクセシビリティ: タブ実装**
- **ファイル**: `src/app/admin/page.tsx` (177-223行目)
- **評価**: `role="tablist"`、`role="tab"`、`aria-selected`、`aria-controls`、`aria-labelledby` が適切に設定され、キーボードナビゲーション（矢印キー）も実装されている

### 2. **React ベストプラクティス: useMemo の適切な使用**
- **ファイル**: `src/components/admin/VideoTable.tsx` (52-61行目)
- **評価**: フィルタリング処理を `useMemo` でメモ化し、パフォーマンス最適化が実施されている

### 3. **エラーハンドリング: 包括的な try-catch**
- **ファイル**: `src/components/path/StepTimeline.tsx` (86-94行目)
- **評価**: `localStorage` アクセスが try-catch でラップされている

### 4. **セマンティックHTML と WAI-ARIA の組み合わせ**
- **ファイル**: `src/components/layout/Header.tsx` (23行目、85行目)
- **評価**: `nav` 要素に `role="navigation"`、`aria-label` が設定されている

### 5. **レスポンシブデザイン**
- **評価**: Tailwind CSS を使用した responsive クラスが適切に設定されている

---

## 📊 サマリー

| カテゴリ | 高 | 中 | 低 | 備考 |
|---------|----|----|----|----|
| アクセシビリティ | 3 | 3 | 0 | 主に aria-label の欠落 |
| XSS脆弱性 | 1 | 1 | 0 | サーバー側のサニタイズ確認必須 |
| TypeScript型安全性 | 0 | 1 | 1 | 全体的に良好 |
| パフォーマンス | 0 | 1 | 1 | memo・useMemo の使用は適切 |
| React ベストプラクティス | 0 | 1 | 1 | 全体的に良好 |
| use client/server | 0 | 0 | 0 | 適切に使い分けられている |

---

## 🎯 推奨アクション

### 優先度 1（最初に対応）
1. Header.tsx の alt 属性を修正（アクセシビリティ）
2. アイコンボタンに aria-label を追加（アクセシビリティ）
3. XSS対策の確認（セキュリティ）

### 優先度 2（次に対応）
1. memo の命名export パターンを修正
2. Unicode エスケープシーケンスを改善（可読性）
3. 複雑な state 管理を簡素化

### 優先度 3（将来の改善）
1. useCallback/useMemo の最適化
2. key prop の最適化
3. type safety の進化（任意）

---

**調査完了**: すべてのコンポーネントを網羅的に確認しました。全体的に質の高いコードとなっており、大きなセキュリティ脆弱性は検出されていません。主な改善点はアクセシビリティ関連です。
