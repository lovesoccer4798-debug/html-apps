# html-apps

> 🪺 **はじめての方へ** — ここはNEST。プログラミング未経験でも、AIと一緒にアプリを作れるようになる場所です。まずは **[START_HERE.md](START_HERE.md)** からどうぞ（10分で読めます）。

AIに依存しない開発ワークスペース。**リポジトリが唯一の正しい情報源（Single Source of Truth）** であり、Claude Code / Codex / Gemini CLI / Cursor / Windsurf など、どのAIツールに切り替えても同じ品質・同じルールで開発を継続できることを目的とする。

## 🚀 30分で開発を再開する手順

新しいAI（または人間）が開発に参加するときは、この順で読む。

1. この `README.md` — 全体像とディレクトリ構成
2. [`AGENTS.md`](AGENTS.md) — AI共通ルール（作業前に必読）
3. [`tasks/STATUS.md`](tasks/STATUS.md) — **今どこまで進んでいるか**のスナップショット
4. [`tasks/`](tasks/) — 進行中・未着手のタスク
5. 該当タスクが参照する仕様書（`apps/<アプリ名>/specs/`）
6. 必要に応じて [`docs/adr/`](docs/adr/) — 過去の設計判断とその理由

AIに再開させる場合は [`prompts/resume-work.md`](prompts/resume-work.md) をそのまま貼り付ければよい。

## 📁 ディレクトリ構成

```
.
├── README.md              # 入口。全体像と再開手順
├── START_HERE.md          # はじめての方向け・10分の案内
├── AGENTS.md              # AI共通ルール（全AIツール向け・唯一のルールファイル）
├── CLAUDE.md / GEMINI.md  # 各AIツール用スタブ（AGENTS.mdへの参照のみ）
├── .windsurf/rules/       # Windsurf用スタブ（同上）
├── LICENSE                # MIT
├── CHANGELOG.md           # ワークスペース基盤の変更履歴（各アプリの履歴はアプリ側に同梱）
├── .github/workflows/     # 最小CI（秘密情報スキャン・リンク切れチェック）
├── docs/                  # ワークスペース共通ドキュメント
│   ├── philosophy/            # 思想層: Story・Manifesto・Vision・Brand Book・Design Principles・Journey
│   ├── vocabulary.md          # 共通語彙台帳（場所の呼び名・絵文字はここから引用）
│   ├── ai-tools.md            # AIツール別セットアップ（ベンダー知識の検疫所）
│   ├── development-flow.md    # 開発フロー
│   ├── git-workflow.md        # Git運用ルール
│   ├── coding-standards.md    # コーディング規約
│   ├── testing-policy.md      # テスト方針
│   ├── review-process.md      # レビュー手順
│   └── adr/                   # 設計判断の記録（YYYYMMDD-スラッグ.md）
├── templates/             # 全テンプレート置き場
│   ├── spec.md / task.md / adr.md
│   └── app/                   # 新規アプリの雛形（README・CHANGELOG・specs/）
├── prompts/               # AIに渡す定型プロンプト
├── tasks/                 # タスク管理（今なにをしているか）
│   ├── STATUS.md              # 現在地スナップショット＝プロジェクト索引（最重要）
│   └── backlog/ in-progress/ done/
└── apps/                  # アプリケーション本体
    └── <アプリ名>/            # アプリ局所の成果物はここに同梱する
        ├── README.md          # 概要・起動方法・テスト方法
        ├── CHANGELOG.md       # このアプリの変更履歴
        ├── specs/             # このアプリの仕様書
        └── （ソースコード）
```

## 🧭 設計思想

| 原則 | 意味 |
|------|------|
| **リポジトリがSSOT** | 仕様・判断・進捗・ルールはすべてファイルに書く。AIとの会話履歴には何も依存しない |
| **ベンダー中立** | AI固有機能に依存しない。ルールは `AGENTS.md` に一元化し、ベンダー固有の設定知識は `docs/ai-tools.md` に隔離する |
| **機械的な品質保証** | ルール遵守をAIの善意に頼らず、CI（秘密情報スキャン・リンクチェック）で下限を保証する |
| **Markdown中心** | すべてのドキュメントはプレーンなMarkdown。特殊なツールなしで読める |
| **アプリ同梱（コロケーション）** | アプリ局所の成果物（仕様書・変更履歴）は `apps/<アプリ名>/` に同梱する。アプリが育ったらディレクトリごと単独リポジトリへ切り出せる |
| **技術スタック非依存** | この構成自体は言語・フレームワークを問わない。スタック固有の規約は `docs/coding-standards.md` に追記して育てる |

## 🎯 対応する開発領域

個人開発（Webアプリ・ツール）／業務自動化スクリプト／モバイルアプリ／AIエージェント開発のすべてに対応できるよう設計されている。プロジェクトは `apps/` 配下に1ディレクトリずつ増やす（`templates/app/` をコピーして始める）。ワークスペース全体のルールは常にルートの `AGENTS.md` と `docs/` が優先される。

## 📚 主要ドキュメント

| ドキュメント | 内容 |
|---|---|
| [思想層（Philosophy）](docs/philosophy/README.md) | NESTの憲法・定規・地図。すべての判断の最上位基準 |
| [開発フロー](docs/development-flow.md) | アプリ作成→仕様→タスク→実装→レビュー→リリースの流れ |
| [Git運用ルール](docs/git-workflow.md) | ブランチ戦略・コミット規約・マージ方式 |
| [コーディング規約](docs/coding-standards.md) | 言語共通の原則と言語別規約 |
| [テスト方針](docs/testing-policy.md) | 何をどこまでテストするか |
| [レビュー手順](docs/review-process.md) | セルフレビュー・AIレビュー・マージ基準 |
| [AIツール別セットアップ](docs/ai-tools.md) | 各AIツールの導入手順・対応状況 |
| [ADR一覧](docs/adr/) | 設計判断の記録 |
