# STATUS — 現在地スナップショット

> **このファイルはワークスペースの「現在地」を示す最重要ファイル。**
> どのAI・どのセッションでも、作業を終えるときに必ず更新すること（`AGENTS.md` 参照）。
> 詳細は書かない — このファイルは薄い索引に保ち、詳細は各タスクファイルの作業ログに書く。

- **最終更新**: 2026-07-08
- **更新者メモ**: レビュー文化に「引き算のレビュー」を吸収（新ルールは足さず review-process.md にレンズ追加）。初回棚卸しパス実施済み。Phase 6完了。次はPhase 7「最初の住人」（オーナーが主役）

## ワークスペース全体の状態

Workspace v1.0.0 リリース済み。**NEST Phase 0〜3が完了**（Phase 3はPages有効化のみ残）。思想層は凍結、歓迎キット・安心の備蓄・Portal（NEST初のアプリ、正式フローで開発）が揃った。初心者テストが正式文化になった（review-process.md §3）。

## プロジェクト索引

| アプリ | 状態 | 一言メモ |
|---|---|---|
| 🏠 [Portal](../apps/portal/README.md) | 🐣→🐦（Pages有効化待ち） | NEST初のアプリ。正式フローのドッグフーディング |

## 進行中のタスク

（なし — 次はNEST Phase 1）

## 次にやるべきこと

1. **【人間の操作】GitHub Pages有効化**（OFFと確定判定済み。Settings→Pages→main→/(root)→Save）＋公開URLの表示確認 → Phase 3〜5完全クローズ
2. **NotebookLM初回同期**（`docs/ai-tools.md` のフロー参照）
3. **Phase 7「最初の住人」**（`docs/roadmap.md` 参照）: オーナー自身が最初の実用アプリを作る（主役＝オーナー）。必要なもの＝Pages有効化＋「作りたいもの」一言
4. 機会があり次第: 実際の人間による初心者テスト（結果は docs/reviews/ に追記）

## 注意点・申し送り

- NotebookLM同期: 未実施（初回はPhase 4完了後。フローは `docs/ai-tools.md` の「NotebookLM運用」参照）

- 価値判断は `docs/philosophy/brand-book.md`（憲法）と `design-principles.md`（定規）が最上位（AGENTS.md §1に明記済み）
- Journeyの個人進捗はこのSTATUSに一行で記録する方式（例: `Journey: Level 3`）。専用ファイルは作らない
- 新しいAIツール導入時: スタブ追加＋ `docs/ai-tools.md` 更新／新スタック採用時: `docs/coding-standards.md` 追記
- LICENSE は MIT を仮採用中。本格公開前に要確認
- クラウドセッションからタグはpush不可。タグ・リリースはGitHubのReleases画面から（`docs/ai-tools.md` 参照）
- 【引き算パスの提案・未処理】CHANGELOG `[Unreleased]` が22件に成長。ワークスペースのリリース（例 v1.1.0）を切って [Unreleased] を版へ繰り上げるとよい。オーナー承認事項
