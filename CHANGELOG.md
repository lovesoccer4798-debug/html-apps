# Changelog

このプロジェクトのユーザーに見える変更をすべて記録する。

形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に基づき、バージョニングは [Semantic Versioning](https://semver.org/lang/ja/) に従う。

## [Unreleased]

### Added

- AIに依存しない開発ワークスペースの初期構築
  - `AGENTS.md`（AI共通ルール）とベンダー別スタブ（`CLAUDE.md` / `GEMINI.md`）
  - `docs/`（開発フロー・Git運用・コーディング規約・テスト方針・レビュー手順・ADR）
  - `specs/` / `tasks/` / `prompts/` の各テンプレート

<!--
リリース時の運用:
1. [Unreleased] の内容を [X.Y.Z] - YYYY-MM-DD セクションに繰り上げる
2. git tag vX.Y.Z を打つ
3. 新しい空の [Unreleased] セクションを上に作る

セクション種別: Added / Changed / Deprecated / Removed / Fixed / Security
-->
