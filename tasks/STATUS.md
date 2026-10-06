# STATUS — 現在地スナップショット

> **このファイルはワークスペースの「現在地」を示す最重要ファイル。**
> どのAI・どのセッションでも、作業を終えるときに必ず更新すること（`AGENTS.md` 参照）。
> 詳細は書かない — このファイルは薄い索引に保ち、詳細は各タスクファイルの作業ログに書く。

- **最終更新**: 2026-10-06
- **TaskARE現在地**: PR #93マージ済み。承認済みBuddyの[PR #94](https://github.com/lovesoccer4798-debug/html-apps/pull/94)作成済み、未マージ。かわいい3種類・自作透過画像・移動・名前/呼ばれ方/口調・FAQ・無料限定対話。初期OFF。NEST Phaseは変更しない。
- **公開状況**: Buddy独立WorkerをFree契約確認後に公開済み。課金設定・既存Worker・秘密情報の変更なし。フロントはPRマージ後に反映。公開先・再公開/停止手順は[運用記録](../apps/task-calendar/buddy-worker/README.md)。
- **検証**: Buddy単体5件＋SQLite runtime 1件、320/390/1440幅・明暗・同意/ログアウト・画像・ドラッグ等の隔離ブラウザー成功。既存自動案内単体18件とv108ブラウザー回帰も成功。公開先401/403確認。実AIの日本語回答は未確認（会話テストはモック）、本人ログインで反映後に確認する。
- **運用**: 既存の無料運用条件・料金プラン・秘密設定・送信上限は変更しない。過去の公開準備履歴は[タスクログ](in-progress/20260714-task-calendar.md)参照。通知サーバー未設定・iPhone実機未確認は継続。

## ワークスペース全体の状態

Workspace v1.0.0 リリース済み。**NEST Phase 0〜7が完了、Phase 9「生きた地図」が実証中**（残りはPhase 8「巣立ちの準備」）。人間向けの入口が Handbook（生きた地図）に一本化され、迎える=Portal／帰る=Handbook／跳ぶ=Dashboard の3ホーム体制になった。実証の計画は `docs/reviews/phase-9.md` 参照。

## プロジェクト索引

| アプリ | 状態 | 一言メモ |
|---|---|---|
| 🏠 [Portal](../apps/portal/README.md) | 🐦 そだち | NEST初のアプリ。玄関＋Dashboard（v1.5.0 — 3ホーム再定義を反映） |
| [Creator Studio](../apps/creator-studio/README.md) | 🐦 そだち | 素材から各AIへ渡すベンダー中立プロンプトを生成（Phase 7・v1.0） |
| [Task Calendar](../apps/task-calendar/README.md) | 🐣 ひな | 個人用タスクカレンダー・PWA。v110 Buddy実装・無料限定サーバー公開済み、PR #94レビュー待ち |

（Handbookはアプリではなく `docs/` の一部。入口は [Handbook表紙](../docs/README.md)）

## 進行中のタスク

- [Handbook実証フェーズ — 開始チェックリストと終了条件](in-progress/20260714-handbook-validation.md)（主担当: オーナー。実証の正本はこのファイル）
- [Task Calendar v1](in-progress/20260714-task-calendar.md)（PR #93マージ済み、v110 Buddy PR #94レビュー待ち。Portal掲載の要否はオーナー判断）

## 次にやるべきこと

1. **[実証開始チェックリスト](in-progress/20260714-handbook-validation.md)を上から進める**（PR→mainマージ→Pages有効化→NotebookLM同期→質問検収5問→実証開始宣言→7日間の実運用）
2. **Creator Studioを実運用で育てる**（実証終了条件の1つ: 5回以上の実戦使用）
3. **初見ユーザーテスト**（実証終了条件の1つ。知り合いに渡して10分観察）
4. **実証ログを1日1〜3分つける**（チェックリスト内の表。7日後のレビュー材料）
5. 終了条件6つがすべて揃ったら**Phase 9正式採用**（roadmap✅・品質パネル「正式採用」・タスクをdoneへ）
6. 保留のオーナー判断: Phase 8の着手時期／アプリ単位のタグ運用の要否／CHANGELOG `[Unreleased]` のv1.1.0繰り上げ（リリースを切る好機）

## 注意点・申し送り

- **思い出シェアカレンダー（v87）はFirebaseのルール追加が必要**。`shared/{calId}/photos/{photoId}` に read/write の許可を足さないと写真の保存だけが失敗する（正本: `apps/task-calendar/specs/task-calendar-memories.md`）。写真はCloud Storageではなく Firestore に入れているので、Blaze（従量課金）への切り替えは不要

- **鮮度情報の正本はHandbook品質パネルへ移設**（NotebookLM同期日はSTATUSではなく[Handbook表紙](../docs/README.md)の品質パネルに記録する。ADR: 20260714-handbook-living-map）
- **Phase 7のレビュー記録（docs/reviews/phase-7.md）が未作成**。遡って書くか欠番として扱うかはオーナー判断（reviews/READMEに注記済み）
- 価値判断は `docs/philosophy/brand-book.md`（憲法）と `design-principles.md`（定規）が最上位（AGENTS.md §1に明記済み）
- Journeyの個人進捗はこのSTATUSに一行で記録する方式（例: `Journey: Level 3`）。専用ファイルは作らない
- 新しいAIツール導入時: スタブ追加＋ `docs/ai-tools.md` 更新／新スタック採用時: `docs/coding-standards.md` 追記
- LICENSE は MIT を仮採用中。本格公開前に要確認
- クラウドセッションからタグはpush不可。タグ・リリースはGitHubのReleases画面から（`docs/ai-tools.md` 参照）
