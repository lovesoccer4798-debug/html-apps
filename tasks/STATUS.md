# STATUS — 現在地スナップショット

> **このファイルはワークスペースの「現在地」を示す最重要ファイル。**
> どのAI・どのセッションでも、作業を終えるときに必ず更新すること（`AGENTS.md` 参照）。
> 詳細は書かない — このファイルは薄い索引に保ち、詳細は各タスクファイルの作業ログに書く。

- **最終更新**: 2026-07-07
- **更新者メモ**: NEST Phase 0（思想層）完了。docs/philosophy/ に6文書を格納

## ワークスペース全体の状態

Workspace v1.0.0 リリース済み。その上に **NESTブランド（AT-Labo運営のDeveloper OS構想）** の構築を開始し、**Phase 0（思想層）が完了**。判断基準となる6文書（Story・Manifesto・Vision・Brand Book・Design Principles・Journey）が `docs/philosophy/` に揃った。アプリケーションはまだない。

## プロジェクト索引

| アプリ | 状態 | 一言メモ |
|---|---|---|
| （まだなし） | — | Phase 3でPortalが最初のアプリになる予定 |

## 進行中のタスク

（なし — 次はNEST Phase 1）

## 次にやるべきこと — NEST Phase 1「歓迎キット」

1. `START_HERE.md`（AIパートナーを迎える節・GitHubへの橋の説明を含む）
2. `prompts/hello-nest.md`（はじめまして専用プロンプト）と `prompts/first-app.md`（最初のアプリを儀式なしで作るプロンプト）
3. ルートREADME冒頭に来訪者バナー（はじめての方→START_HERE）
4. 完了条件: 初見の人が15分で「AIと挨拶→Journey Level 1クリア」できること

## 注意点・申し送り

- 価値判断は `docs/philosophy/brand-book.md`（憲法）と `design-principles.md`（定規）が最上位（AGENTS.md §1に明記済み）
- Journeyの個人進捗はこのSTATUSに一行で記録する方式（例: `Journey: Level 3`）。専用ファイルは作らない
- 新しいAIツール導入時: スタブ追加＋ `docs/ai-tools.md` 更新／新スタック採用時: `docs/coding-standards.md` 追記
- LICENSE は MIT を仮採用中。本格公開前に要確認
- クラウドセッションからタグはpush不可。タグ・リリースはGitHubのReleases画面から（`docs/ai-tools.md` 参照）
