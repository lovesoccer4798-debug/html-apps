# STATUS — 現在地スナップショット

> **このファイルはワークスペースの「現在地」を示す最重要ファイル。**
> どのAI・どのセッションでも、作業を終えるときに必ず更新すること（`AGENTS.md` 参照）。
> 詳細は書かない — このファイルは薄い索引に保ち、詳細は各タスクファイルの作業ログに書く。

- **最終更新**: 2026-07-13
- **更新者メモ**: Navigator v1（Context Budget運用）の仕様を起票（`tasks/backlog/20260713-navigator-v1.md`）。オーナーの仕様確認待ち。実装（Step 3）は未着手

## ワークスペース全体の状態

Workspace v1.0.0 リリース済み。**NEST Phase 0〜7が完了**。思想層は凍結、歓迎キット・安心の備蓄・Portal・Dashboard・デザインシステム・ガバナンスが揃い、**初の実用アプリ Creator Studio v1.0 が誕生**（North Star第1指標＝公開アプリが1に）。残る人間操作は GitHub Pages 有効化。

## プロジェクト索引

| アプリ | 状態 | 一言メモ |
|---|---|---|
| 🏠 [Portal](../apps/portal/README.md) | 🐦 そだち | NEST初のアプリ。玄関＋Dashboard |
| [Creator Studio](../apps/creator-studio/README.md) | 🐦 そだち | 素材から各AIへ渡すベンダー中立プロンプトを生成（Phase 7・v1.0） |

## 進行中のタスク

### 再開ブロック（2026-07-13）
- 現在地: Navigator v1のStep 2（仕様書き起こし）完了。仕様は `tasks/backlog/20260713-navigator-v1.md` に内包。Step 3（実装）は未着手
- 次の一歩: オーナーが同ファイルの仕様を確認・承認 → 承認後、実装AIの新セッションに同ファイルのContext Manifestだけを渡してStep 3を開始する
- 読むもの: このブロック＋ `tasks/backlog/20260713-navigator-v1.md`
- 触るな: 仕様のスコープ（Manifest・Reviewer・再開ブロックの3点）。追加案はすべて仕様内Future表へ
- 前回消費: 仕様設計〜書き起こしまで対話5往復（設計議論が大半。書き起こし自体は軽量）

## 次にやるべきこと

1. **【人間の操作】GitHub Pages有効化**（OFFと確定判定済み。Settings→Pages→main→/(root)→Save）→ Portal・Creator Studio の公開URL確認
2. **Creator Studioを実運用で育てる**（実際に各AIへ貼って生成品質を評価・specやSETTINGSを調整。NESTの「使いながら育てる」）
3. **NotebookLM初回同期**（`docs/ai-tools.md` のフロー参照）
4. **次フェーズはオーナー判断**（ロードマップの着手順はオーナーが決める。AIは次フェーズを確定・宣言しない）
5. 保留のオーナー判断: アプリ単位のタグ運用（`creator-studio-v1.0.0` 等）の要否

## 注意点・申し送り

- NotebookLM同期: 未実施（初回はPhase 4完了後。フローは `docs/ai-tools.md` の「NotebookLM運用」参照）

- 価値判断は `docs/philosophy/brand-book.md`（憲法）と `design-principles.md`（定規）が最上位（AGENTS.md §1に明記済み）
- Journeyの個人進捗はこのSTATUSに一行で記録する方式（例: `Journey: Level 3`）。専用ファイルは作らない
- 新しいAIツール導入時: スタブ追加＋ `docs/ai-tools.md` 更新／新スタック採用時: `docs/coding-standards.md` 追記
- LICENSE は MIT を仮採用中。本格公開前に要確認
- クラウドセッションからタグはpush不可。タグ・リリースはGitHubのReleases画面から（`docs/ai-tools.md` 参照）
- 【引き算パスの提案・未処理】CHANGELOG `[Unreleased]` が22件に成長。ワークスペースのリリース（例 v1.1.0）を切って [Unreleased] を版へ繰り上げるとよい。オーナー承認事項
