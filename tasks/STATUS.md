# STATUS — 現在地スナップショット

> **このファイルはワークスペースの「現在地」を示す最重要ファイル。**
> どのAI・どのセッションでも、作業を終えるときに必ず更新すること（`AGENTS.md` 参照）。
> 詳細は書かない — このファイルは薄い索引に保ち、詳細は各タスクファイルの作業ログに書く。

- **最終更新**: 2026-07-14
- **更新者メモ**: Phase 9「生きた地図」完了。Handbook表紙を「毎日開くホーム」へ改組（Today・目的導線・見取り図・品質パネル）、atlas新設、3ホームの役割再定義。オーナーの実機確認とPages有効化が残

## ワークスペース全体の状態

Workspace v1.0.0 リリース済み。**NEST Phase 0〜7・9が完了**（残りはPhase 8「巣立ちの準備」）。人間向けの入口が Handbook（生きた地図）に一本化され、迎える=Portal／帰る=Handbook／跳ぶ=Dashboard の3ホーム体制になった。残る人間操作は GitHub Pages 有効化（最優先）と NotebookLM 初回同期。

## プロジェクト索引

| アプリ | 状態 | 一言メモ |
|---|---|---|
| 🏠 [Portal](../apps/portal/README.md) | 🐦 そだち | NEST初のアプリ。玄関＋Dashboard（v1.5.0 — 3ホーム再定義を反映） |
| [Creator Studio](../apps/creator-studio/README.md) | 🐦 そだち | 素材から各AIへ渡すベンダー中立プロンプトを生成（Phase 7・v1.0） |

（Handbookはアプリではなく `docs/` の一部。入口は [Handbook表紙](../docs/README.md)）

## 進行中のタスク

（なし）

## 次にやるべきこと

1. **【人間の操作】GitHub Pages有効化**（最優先。Settings→Pages→main→/(root)→Save）→ Portal・Handbook・Creator Studio の公開URL確認
2. **NotebookLM初回同期**（`docs/ai-tools.md` のフロー参照。検収質問は4問に更新済み）→ 完了したらHandbook品質パネルに日付記録
3. **Handbookの本物の初見者テスト**（知り合いに渡して10分観察 — `docs/reviews/phase-9.md` の残作業）
4. **Creator Studioを実運用で育てる**（実際に各AIへ貼って生成品質を評価）
5. **次フェーズはオーナー判断**（Phase 8「巣立ちの準備」が未着手として残っている）
6. 保留のオーナー判断: アプリ単位のタグ運用の要否／CHANGELOG `[Unreleased]` のv1.1.0繰り上げ（Phase 9完了でさらに成長。リリースを切る好機）

## 注意点・申し送り

- **鮮度情報の正本はHandbook品質パネルへ移設**（NotebookLM同期日はSTATUSではなく[Handbook表紙](../docs/README.md)の品質パネルに記録する。ADR: 20260714-handbook-living-map）
- **Phase 7のレビュー記録（docs/reviews/phase-7.md）が未作成**。遡って書くか欠番として扱うかはオーナー判断（reviews/READMEに注記済み）
- 価値判断は `docs/philosophy/brand-book.md`（憲法）と `design-principles.md`（定規）が最上位（AGENTS.md §1に明記済み）
- Journeyの個人進捗はこのSTATUSに一行で記録する方式（例: `Journey: Level 3`）。専用ファイルは作らない
- 新しいAIツール導入時: スタブ追加＋ `docs/ai-tools.md` 更新／新スタック採用時: `docs/coding-standards.md` 追記
- LICENSE は MIT を仮採用中。本格公開前に要確認
- クラウドセッションからタグはpush不可。タグ・リリースはGitHubのReleases画面から（`docs/ai-tools.md` 参照）
