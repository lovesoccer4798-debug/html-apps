# STATUS — 現在地スナップショット

> **このファイルはワークスペースの「現在地」を示す最重要ファイル。**
> どのAI・どのセッションでも、作業を終えるときに必ず更新すること（`AGENTS.md` 参照）。
> 詳細は書かない — このファイルは薄い索引に保ち、詳細は各タスクファイルの作業ログに書く。

- **最終更新**: 2026-07-07
- **更新者メモ**: NEST Phase 3（Portal）実装完了。GitHub Pages有効化（人間の操作）待ち

## ワークスペース全体の状態

Workspace v1.0.0 リリース済み。**NEST Phase 0〜3が完了**（Phase 3はPages有効化のみ残）。思想層は凍結、歓迎キット・安心の備蓄・Portal（NEST初のアプリ、正式フローで開発）が揃った。初心者テストが正式文化になった（review-process.md §3）。

## プロジェクト索引

| アプリ | 状態 | 一言メモ |
|---|---|---|
| 🏠 [Portal](../apps/portal/README.md) | 🐣→🐦（Pages有効化待ち） | NEST初のアプリ。正式フローのドッグフーディング |

## 進行中のタスク

（なし — 次はNEST Phase 1）

## 次にやるべきこと

1. **【人間の操作】GitHub Pages有効化**（`docs/human-only-operations.md` の手順どおり）→ 公開URL確認でPhase 3完全クローズ
2. **Phase 4「廊下」**（`docs/roadmap.md` 参照）: Jekyll有効化で全MarkdownをHTML化・Portalリンク差し替え・CIバッジ・印刷CSS
3. 機会があり次第: 実際の人間による初心者テスト（結果は docs/reviews/phase-3.md に追記）

## 注意点・申し送り

- 価値判断は `docs/philosophy/brand-book.md`（憲法）と `design-principles.md`（定規）が最上位（AGENTS.md §1に明記済み）
- Journeyの個人進捗はこのSTATUSに一行で記録する方式（例: `Journey: Level 3`）。専用ファイルは作らない
- 新しいAIツール導入時: スタブ追加＋ `docs/ai-tools.md` 更新／新スタック採用時: `docs/coding-standards.md` 追記
- LICENSE は MIT を仮採用中。本格公開前に要確認
- クラウドセッションからタグはpush不可。タグ・リリースはGitHubのReleases画面から（`docs/ai-tools.md` 参照）
