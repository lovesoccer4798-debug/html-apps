# Phase 4 レビュー記録 — 廊下（HTML Handbook）

- **日付**: 2026-07-07
- **成果物**: `_config.yml`（Jekyll有効化）、Portal v1.1.0（サイト内リンク化・CIバッジ・印刷CSS）、START_HERE冒頭の両文脈対応、AI切替ガイド、NotebookLM同期対象のフォルダ単位化、[ADR: Jekyll採用](../adr/20260707-jekyll-pages.md)

## 目的

初心者がGitHubのUIを一度も見ずにHandbook・Knowledge・Journeyを読み回れる状態（HTML Handbook）を、追加インフラゼロで実現する。あわせてオーナー提案2件（AI切替ガイド・同期対象のフォルダ単位化）を取り込む。

## レビュー結果

- Pages標準プラグイン（optional-front-matter / relative-links / readme-index / titles-from-headings）により、`_config.yml` 1枚で既存Markdownを無改変のままHTML化できることを確認
- 事前レビューで落とし穴3件を検出し対処: ①テーマのナビに全ページが並ぶ→`header_pages`で制御 ②START_HERE冒頭の「いまGitHubにいます」がWebページ版で嘘になる→両文脈対応に書き直し ③HTML内から文書へのリンクは自動書き換えが効かない→Portalは`.html`/フォルダURLで記述
- **初心者テスト**: この環境からgithub.ioへ到達できないため、Pages上の実表示は**オーナーによる確認が必要**（シミュレーションはローカルHTML＋設定の机上検証まで。規定に基づき明記する）

## 採用

- HTML化はPages内蔵Jekyll＋minimaテーマ（自前ビルド・実行時JS変換は却下 — 保守対象を増やさない）
- AI切替ガイド: 腐らない部分（切替タイミング3条件・手順4ステップ）と腐る部分（AI比較表）を分離し、比較表に「最終確認日」を義務付け
- NotebookLM同期対象をフォルダ単位に変更（docs/・knowledge/・prompts/丸ごと＋ルート2枚＋STATUS）。ADR・reviewsも対象に含め「なぜ？」に答えられる先生にする

## 却下

- 自前静的サイトジェネレータ／実行時Markdownパーサ（ADR参照）
- Mermaid図のPages対応（外部JS依存が必要。コードブロック劣化を受容し、必要が高まったら再検討）

## 理由

派生物（HTML）は「消えても無傷」であるべきで、凝った変換層はその原則を裏切り始める。設定1枚のJekyllは、変換層として最も薄く、最も長寿命な選択。

## 残作業（オーナー確認）

- [ ] GitHub Pages有効化と公開URLでの表示確認（Portal・START_HERE・Handbook表紙・knowledge）
- [ ] 確認後、実際の人間による初心者テストの機会があれば実施し、ここに追記

## 追記（2026-07-07・Pages状態の切り分け結果）

「Pagesが有効化されていないようです」の根拠を切り分けた。**判定: PagesはOFF（確定）**。GitHub APIでリポジトリのワークフロー一覧を照会した結果、存在するのは自作CIのみで、Pagesを一度でも有効化すると必ず生成される「pages build and deployment」ワークフローが存在しなかった。実行環境からgithub.ioへ直接アクセスできない制約とは独立した、API証拠による判定である。有効化はオーナーの操作待ち（`docs/human-only-operations.md` 参照）。
