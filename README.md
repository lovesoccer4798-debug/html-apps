# html-apps

AIに依存しない開発ワークスペース。**リポジトリが唯一の正しい情報源（Single Source of Truth）** であり、Claude Code / Codex / Gemini CLI / Cursor / Windsurf など、どのAIツールに切り替えても同じ品質・同じルールで開発を継続できることを目的とする。

## 🚀 30分で開発を再開する手順

新しいAI（または人間）が開発に参加するときは、この順で読む。

1. この `README.md` — 全体像とディレクトリ構成
2. [`AGENTS.md`](AGENTS.md) — AI共通ルール（作業前に必読）
3. [`tasks/STATUS.md`](tasks/STATUS.md) — **今どこまで進んでいるか**のスナップショット
4. [`tasks/`](tasks/) — 進行中・未着手のタスク
5. 該当タスクが参照する [`specs/`](specs/) の仕様書
6. 必要に応じて [`docs/adr/`](docs/adr/) — 過去の設計判断とその理由

AIに再開させる場合は [`prompts/resume-work.md`](prompts/resume-work.md) をそのまま貼り付ければよい。

## 📁 ディレクトリ構成

```
.
├── README.md              # 入口。全体像と再開手順
├── AGENTS.md              # AI共通ルール（全AIツール向け・唯一のルールファイル）
├── CLAUDE.md              # Claude Code用スタブ（AGENTS.mdへの参照のみ）
├── GEMINI.md              # Gemini CLI用スタブ（AGENTS.mdへの参照のみ）
├── CHANGELOG.md           # 変更履歴（Keep a Changelog形式）
├── docs/                  # 恒久的なドキュメント
│   ├── development-flow.md    # 開発フロー
│   ├── git-workflow.md        # Git運用ルール
│   ├── coding-standards.md    # コーディング規約
│   ├── testing-policy.md      # テスト方針
│   ├── review-process.md      # レビュー手順
│   └── adr/                   # 設計判断の記録（Architecture Decision Record）
│       ├── TEMPLATE.md
│       └── 0001-*.md
├── specs/                 # 機能仕様書（何を作るか）
│   ├── README.md
│   └── TEMPLATE.md
├── tasks/                 # タスク管理（今なにをしているか）
│   ├── STATUS.md              # 現在地スナップショット（最重要）
│   ├── TEMPLATE.md
│   ├── backlog/               # 未着手
│   ├── in-progress/           # 進行中
│   └── done/                  # 完了
├── prompts/               # AIに渡す定型プロンプト
│   ├── README.md
│   ├── resume-work.md         # 作業再開用
│   ├── implement-feature.md   # 機能実装用
│   ├── fix-bug.md             # バグ修正用
│   └── review-code.md         # コードレビュー用
└── apps/                  # アプリケーション本体（プロジェクトごとにサブディレクトリ）
```

## 🧭 設計思想

| 原則 | 意味 |
|------|------|
| **リポジトリがSSOT** | 仕様・判断・進捗・ルールはすべてファイルに書く。AIとの会話履歴には何も依存しない |
| **ベンダー中立** | AI固有機能（特定ツールのメモリ、独自設定形式など）に依存しない。ルールは `AGENTS.md` に一元化し、各AI用ファイルはスタブに留める |
| **Markdown中心** | すべてのドキュメントはプレーンなMarkdown。特殊なツールなしで読める |
| **知識の置き場を分離** | 恒久的な決定→`docs/adr/`、仕様→`specs/`、進行状態→`tasks/`、AIへの指示→`prompts/` |
| **技術スタック非依存** | この構成自体は言語・フレームワークを問わない。スタック固有の規約は `docs/coding-standards.md` に追記して育てる |

## 🎯 対応する開発領域

この構成は以下すべてに対応できるよう設計されている。

- 個人開発（Webアプリ・ツール）
- 業務自動化スクリプト
- モバイルアプリ
- AIエージェント開発

プロジェクトが増えたら `apps/` 配下にサブディレクトリを切り、プロジェクト固有の README をそこに置く。ワークスペース全体のルールは常にルートの `AGENTS.md` と `docs/` が優先される。

## 📚 主要ドキュメント

| ドキュメント | 内容 |
|---|---|
| [開発フロー](docs/development-flow.md) | 仕様→タスク→実装→レビュー→リリースの流れ |
| [Git運用ルール](docs/git-workflow.md) | ブランチ戦略・コミット規約 |
| [コーディング規約](docs/coding-standards.md) | 言語共通の原則と言語別規約 |
| [テスト方針](docs/testing-policy.md) | 何をどこまでテストするか |
| [レビュー手順](docs/review-process.md) | セルフレビュー・AIレビュー・マージ基準 |
| [ADR一覧](docs/adr/) | 設計判断の記録 |
