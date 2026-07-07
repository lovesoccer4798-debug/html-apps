# STATUS — 現在地スナップショット

> **このファイルはワークスペースの「現在地」を示す最重要ファイル。**
> どのAI・どのセッションでも、作業を終えるときに必ず更新すること（`AGENTS.md` 参照）。
> 詳細は書かない — このファイルは薄い索引に保ち、詳細は各タスクファイルの作業ログに書く。

- **最終更新**: 2026-07-07
- **更新者メモ**: NEST Phase 1（歓迎キット）完了。思想層はv1.0改訂（凍結・North Star・円環Journey）済み

## ワークスペース全体の状態

Workspace v1.0.0 リリース済み。**NEST Phase 0（思想層）とPhase 1（歓迎キット）が完了**。思想層6文書はVersion 1系で凍結。初見者の動線（README来訪者バナー→START_HERE→hello-nest→first-app）が開通し、「15分でAIと挨拶→Journey Level 1」が可能になった。アプリケーションはまだない。

## プロジェクト索引

| アプリ | 状態 | 一言メモ |
|---|---|---|
| （まだなし） | — | Phase 3でPortalが最初のアプリになる予定 |

## 進行中のタスク

（なし — 次はNEST Phase 1）

## 次にやるべきこと — NEST Phase 2「安心の備蓄」

1. Knowledge種まき5件（push 403・タグはReleases画面から・デフォルトブランチ変更など実体験を記録）＋ `knowledge/` ディレクトリ新設
2. Handbook付録「人間にしかできない操作リスト」
3. `docs/glossary.md`（用語集）＋Handbook目次（docs/README.md・第0〜8章）
4. 完了条件: 初めて困った人が5分以内に「先輩の転んだ跡」を見つけられること

## 注意点・申し送り

- 価値判断は `docs/philosophy/brand-book.md`（憲法）と `design-principles.md`（定規）が最上位（AGENTS.md §1に明記済み）
- Journeyの個人進捗はこのSTATUSに一行で記録する方式（例: `Journey: Level 3`）。専用ファイルは作らない
- 新しいAIツール導入時: スタブ追加＋ `docs/ai-tools.md` 更新／新スタック採用時: `docs/coding-standards.md` 追記
- LICENSE は MIT を仮採用中。本格公開前に要確認
- クラウドセッションからタグはpush不可。タグ・リリースはGitHubのReleases画面から（`docs/ai-tools.md` 参照）
