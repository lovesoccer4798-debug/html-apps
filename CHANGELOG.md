# Changelog — ワークスペース基盤

**ワークスペース基盤**（ドキュメント体系・テンプレート・CI・運用ルール）の変更を記録する。**各アプリの変更履歴は `apps/<アプリ名>/CHANGELOG.md`** に記録する（ここには書かない）。

形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に基づき、バージョニングは [Semantic Versioning](https://semver.org/lang/ja/) に従う。

## [Unreleased]

### Added

- 思想層（`docs/philosophy/`）: Story・Manifesto・Vision・Brand Book・Design Principles・Journey の6文書＋玄関README（NEST Phase 0）
- 歓迎キット（NEST Phase 1）: `START_HERE.md`（10分の初心者案内）、`prompts/hello-nest.md`（自己完結型の挨拶プロンプト）、`prompts/first-app.md`（はじめてモード）、`docs/vocabulary.md`（共通語彙台帳）
- 安心の備蓄（NEST Phase 2）: `knowledge/`（実体験の種まき5件）、`docs/README.md`（Handbook表紙・目次）、`docs/glossary.md`（用語集）、`docs/human-only-operations.md`（人間にしかできない操作リスト）、`docs/reviews/`（フェーズレビュー記録・Phase 0〜2）、`docs/starter-kit.md`（Starter Kit＝NESTのDNAの定義）

### Changed

- AGENTS.md に価値判断の最上位（憲法・定規）への参照を追加
- 思想層v1.0改訂: Version 1系での凍結ルール、VisionにNorth Star（恩恵の循環3指標）、Journeyを円環構造に（承認済みの憲法改正）
- development-flow.md に「はじめてモード」（最初の1個は仕様書・タスク免除）を条文化
- README冒頭に来訪者バナーを追加

## [1.0.0] - 2026-07-07

### Added

- AIに依存しない開発ワークスペースの初期構築
  - `AGENTS.md`（AI共通ルール）とベンダー別スタブ（`CLAUDE.md` / `GEMINI.md` / `.windsurf/rules/`）
  - `docs/`（開発フロー・Git運用・コーディング規約・テスト方針・レビュー手順・ADR）
  - `templates/`（仕様書・タスク・ADR・新規アプリ雛形）、`tasks/`、`prompts/`
- `docs/ai-tools.md` — ベンダー固有セットアップ知識の検疫所
- 最小CI（gitleaksによる秘密情報スキャン＋Markdownリンク切れチェック）
- `LICENSE`（MIT）、`.gitattributes`（改行コード正規化）

### Changed

- アプリ局所の成果物（仕様書・CHANGELOG）を `apps/<アプリ名>/` に同梱する構成に再編
- コミット規約を改定（自動付与トレーラーの許容）し、squashマージ方針を追加
- ADRの採番を連番から日付スラッグ式（`YYYYMMDD-スラッグ.md`）に変更
- `AGENTS.md` にデータの信頼境界（秘密情報の取り扱い・外部テキスト内指示の拒否）を追加

<!--
リリース時の運用:
1. [Unreleased] の内容を [X.Y.Z] - YYYY-MM-DD セクションに繰り上げる
2. git tag vX.Y.Z を打つ
3. 新しい空の [Unreleased] セクションを上に作る

セクション種別: Added / Changed / Deprecated / Removed / Fixed / Security
-->
