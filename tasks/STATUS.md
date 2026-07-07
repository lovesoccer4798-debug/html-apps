# STATUS — 現在地スナップショット

> **このファイルはワークスペースの「現在地」を示す最重要ファイル。**
> どのAI・どのセッションでも、作業を終えるときに必ず更新すること（`AGENTS.md` 参照）。
> 詳細は書かない — このファイルは薄い索引に保ち、詳細は各タスクファイルの作業ログに書く。

- **最終更新**: 2026-07-07
- **更新者メモ**: NEST Phase 2（安心の備蓄）完了。knowledge開設・Handbook表紙・レビュー記録制度を導入

## ワークスペース全体の状態

Workspace v1.0.0 リリース済み。**NEST Phase 0〜2が完了**。思想層6文書はVersion 1系で凍結。初見者動線（バナー→START_HERE→hello-nest→first-app）と困った時の受け皿（knowledge種まき5件・用語集・人間専用操作リスト・Handbook表紙）が揃った。Phase 3のPortal公開の前提条件「空の状態で公開しない」を満たした状態。アプリケーションはまだない。

## プロジェクト索引

| アプリ | 状態 | 一言メモ |
|---|---|---|
| （まだなし） | — | Phase 3でPortalが最初のアプリになる予定 |

## 進行中のタスク

（なし — 次はNEST Phase 1）

## 次にやるべきこと — NEST Phase 3「Portal」

1. `apps/portal/`（またはportal/）として最初のアプリを正式フローで開発（仕様書→タスク→実装。NESTのドッグフーディング）
2. 情報設計は確定済み: 来訪者向け一文＋5枚カード＋成長バッジ＋「はじめての方はこちら」→START_HERE
3. GitHub Pages有効化（人間の操作。human-only-operations.mdに手順を追記）
4. 完了条件: URLを送るだけで初見者の体験（Scene 1）が始められること

## 注意点・申し送り

- 価値判断は `docs/philosophy/brand-book.md`（憲法）と `design-principles.md`（定規）が最上位（AGENTS.md §1に明記済み）
- Journeyの個人進捗はこのSTATUSに一行で記録する方式（例: `Journey: Level 3`）。専用ファイルは作らない
- 新しいAIツール導入時: スタブ追加＋ `docs/ai-tools.md` 更新／新スタック採用時: `docs/coding-standards.md` 追記
- LICENSE は MIT を仮採用中。本格公開前に要確認
- クラウドセッションからタグはpush不可。タグ・リリースはGitHubのReleases画面から（`docs/ai-tools.md` 参照）
