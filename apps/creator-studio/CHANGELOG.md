# Changelog — Creator Studio

このアプリのユーザーに見える変更を記録する（[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) 形式・[Semantic Versioning](https://semver.org/lang/ja/) 準拠）。

## [Unreleased]

### Added

- 仕様書（`specs/creator-studio.md`）とアプリの雛形を作成（Phase 7 / Step 1）
- 静的レイアウト（PC2カラム／スマホ1カラム／ダーク・Lucideアイコン）（Step 2）
- データ駆動（MEDIA/SETTINGS配列）・設定UI動的生成・LocalStorage保存/復元・生成・コピー（Step 3）
- **Prompt Engine v1**（`buildPrompt`を「入力→AIへ渡すPromptを生成するエンジン」として明確化。AI非依存・純粋関数・将来はConnectorを外側に足すだけ）（Step 5）
- 媒体別の指針（spec）をブラッシュアップし、Note/X/Threads/リールが「その媒体らしい」出力になるよう改善（Step 5）
