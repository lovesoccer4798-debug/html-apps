# STATUS — 現在地スナップショット

> **このファイルはワークスペースの「現在地」を示す最重要ファイル。**
> どのAI・どのセッションでも、作業を終えるときに必ず更新すること（`AGENTS.md` 参照）。
> 詳細は書かない — このファイルは薄い索引に保ち、詳細は各タスクファイルの作業ログに書く。

- **最終更新**: 2026-07-14
- **更新者メモ**: Phase 9「生きた地図」実装完了 → **実証フェーズへ**（実証してから正式採用）。Handbook表紙を「毎日開くホーム」へ改組（Today・今日の一歩・目的導線・見取り図・品質パネル）、atlas新設、3ホームの役割再定義

## ワークスペース全体の状態

Workspace v1.0.0 リリース済み。**NEST Phase 0〜7が完了、Phase 9「生きた地図」が実証中**（残りはPhase 8「巣立ちの準備」）。人間向けの入口が Handbook（生きた地図）に一本化され、迎える=Portal／帰る=Handbook／跳ぶ=Dashboard の3ホーム体制になった。実証の計画は `docs/reviews/phase-9.md` 参照。

## プロジェクト索引

| アプリ | 状態 | 一言メモ |
|---|---|---|
| 🏠 [Portal](../apps/portal/README.md) | 🐦 そだち | NEST初のアプリ。玄関＋Dashboard（v1.5.0 — 3ホーム再定義を反映） |
| [Creator Studio](../apps/creator-studio/README.md) | 🐦 そだち | 素材から各AIへ渡すベンダー中立プロンプトを生成（Phase 7・v1.0） |

（Handbookはアプリではなく `docs/` の一部。入口は [Handbook表紙](../docs/README.md)）

## 進行中のタスク

（なし）

## 次にやるべきこと（Phase 9実証フェーズ — オーナー決定の順）

1. **【人間の操作】GitHub Pages有効化**（Settings→Pages→main→/(root)→Save）→ Portal・Handbook・Creator Studio の公開URL確認
2. **オーナーがHandbookを数日、毎日のホームとして実運用**（気づきはknowledge/かphase-9レビューへ）
3. **NotebookLM初回同期＋検収質問4問**（`docs/ai-tools.md`）→ 完了したらHandbook品質パネルに日付記録
4. **Handbookの本物の初見者テスト**（知り合いに渡して10分観察）→ **4つ合格でPhase 9正式採用**（roadmap✅・品質パネル更新）
5. **Creator Studioを実運用で育てる**（実際に各AIへ貼って生成品質を評価）
6. 保留のオーナー判断: Phase 8の着手時期／アプリ単位のタグ運用の要否／CHANGELOG `[Unreleased]` のv1.1.0繰り上げ（リリースを切る好機）

## 注意点・申し送り

- **鮮度情報の正本はHandbook品質パネルへ移設**（NotebookLM同期日はSTATUSではなく[Handbook表紙](../docs/README.md)の品質パネルに記録する。ADR: 20260714-handbook-living-map）
- **Phase 7のレビュー記録（docs/reviews/phase-7.md）が未作成**。遡って書くか欠番として扱うかはオーナー判断（reviews/READMEに注記済み）
- 価値判断は `docs/philosophy/brand-book.md`（憲法）と `design-principles.md`（定規）が最上位（AGENTS.md §1に明記済み）
- Journeyの個人進捗はこのSTATUSに一行で記録する方式（例: `Journey: Level 3`）。専用ファイルは作らない
- 新しいAIツール導入時: スタブ追加＋ `docs/ai-tools.md` 更新／新スタック採用時: `docs/coding-standards.md` 追記
- LICENSE は MIT を仮採用中。本格公開前に要確認
- クラウドセッションからタグはpush不可。タグ・リリースはGitHubのReleases画面から（`docs/ai-tools.md` 参照）
