# Changelog — ワークスペース基盤

**ワークスペース基盤**（ドキュメント体系・テンプレート・CI・運用ルール）の変更を記録する。**各アプリの変更履歴は `apps/<アプリ名>/CHANGELOG.md`** に記録する（ここには書かない）。

形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に基づき、バージョニングは [Semantic Versioning](https://semver.org/lang/ja/) に従う。

## [Unreleased]

### Added

- 思想層（`docs/philosophy/`）: Story・Manifesto・Vision・Brand Book・Design Principles・Journey の6文書＋玄関README（NEST Phase 0）
- 歓迎キット（NEST Phase 1）: `START_HERE.md`（10分の初心者案内）、`prompts/hello-nest.md`（自己完結型の挨拶プロンプト）、`prompts/first-app.md`（はじめてモード）、`docs/vocabulary.md`（共通語彙台帳）
- 安心の備蓄（NEST Phase 2）: `knowledge/`（実体験の種まき5件）、`docs/README.md`（Handbook表紙・目次）、`docs/glossary.md`（用語集）、`docs/human-only-operations.md`（人間にしかできない操作リスト）、`docs/reviews/`（フェーズレビュー記録・Phase 0〜2）、`docs/starter-kit.md`（Starter Kit＝NESTのDNAの定義）
- Portal（NEST Phase 3）: NEST初のアプリ `apps/portal/` を正式フローで開発。ルートに公開用リダイレクト`index.html`。初心者テストを正式文化に追加（review-process.md §3）、Pages有効化手順をhuman-only-operations.mdに追記、Starter Kit DNAにレビュー文化を追加

### Added

- 廊下（NEST Phase 4）: `_config.yml` によるJekyll有効化 — 全Markdownが自動でHTMLページ化（HTML Handbook実現）。AI切替ガイド（切替タイミング・手順・最終確認日付きAI比較表）をai-tools.mdに追加

### Changed

- デザインシステム（NEST Phase 6）: 見た目の値を `tokens.css` に集約（Design Tokens）。`style.css` はトークンを消費するだけに。Portal/Dashboardの役割を背景色で差別化（Portal=迎える面／Dashboard=作業面）、Dashboard非肥大ガバナンスを明文化、`templates/app/tokens.css` を追加（新アプリのDNA）。判断は ADR `20260708-design-tokens.md`。「最初の住人」はPhase 7へ繰り下げ、Portal全体検索はFuture候補に
- デザイン統一（Phase 5.5）: UIの絵文字をLucideアイコン（インラインSVG同梱・CDNなし）へ移行。方針は `docs/design-guide.md`、判断は ADR `20260708-icon-system.md`。Dashboardの文言（迷ったら）・並び順・NotebookLM入口も改善
- ダッシュボード（NEST Phase 5）: Portal v1.2.0 — 毎日使う人のホーム `dashboard.html` を追加（新機能なし・情報整理のみ、全情報へ2クリック以内）。4つの役割（Portal/Dashboard/Handbook/Knowledge）を語彙台帳に正式定義。docs/adr/ にREADMEを追加（Pages上の404解消）
- Portal v1.1.0: リンク先をサイト内HTMLへ・CIバッジ・印刷CSS（PDF対応）
- NotebookLM同期対象をファイル列挙から**フォルダ単位**へ変更（追加漏れの構造的防止）
- NotebookLM同期フローを正式ルール化（対象リスト・検収質問3問・STATUS記録。ai-tools.md）
- roadmap.md にFuture節（Developer OS→Creator OSの余白、実装も設計もしない宣言）を追加
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
