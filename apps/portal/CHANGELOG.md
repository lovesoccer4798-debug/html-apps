# Changelog — NEST Portal

このアプリのユーザーに見える変更を記録する（[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) 形式・[Semantic Versioning](https://semver.org/lang/ja/) 準拠）。

## [Unreleased]

## [1.3.0] - 2026-07-08

### Changed

- UIの絵文字をLucideアイコン（インラインSVG）へ置換（成長バッジとロゴ🪺は意図して維持）
- Dashboardのグループ名「よりどころ」→「迷ったら」（行動起点で統一）
- Dashboardの並び順を使用頻度順へ（いまを知る→つくる→AIと→しらべる→まなぶ→迷ったら）
- NotebookLMを「AIと」カードの先頭へ昇格（「文章で質問できるAI先生」）

## [1.2.0] - 2026-07-07

### Added

- 🧭 Dashboard（2ページ目）: 毎日使う人のホーム。6グループの整理で全情報へ2クリック以内
- ヘッダーに「2回目以降の方はこちら」ボタン

### Changed

- CSSを `style.css` に分離（2ページで共有）

## [1.1.0] - 2026-07-07

### Changed

- 全カード・ボタンのリンク先をGitHubのファイル表示から**サイト内のHTMLページ**へ変更（Jekyll化に伴う。橋の注意書きも更新）

### Added

- フッターにCI（自動検査）の状態バッジ
- 印刷用CSS（ブラウザの「PDFに保存」できれいに出力できる）

## [1.0.0] - 2026-07-07

### Added

- 初版: ヘッダー（Philosophy・来訪者向けの一文・START_HEREボタン・GitHubへの橋）、5つの場所カード（開閉式解説付き）、Apps一覧（成長バッジ）、Journey/STATUS導線、フッター
- JavaScriptゼロ・外部依存ゼロ・スマホ/ダークモード対応
