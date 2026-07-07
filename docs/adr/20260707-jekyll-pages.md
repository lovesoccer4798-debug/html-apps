# ADR: HTML HandbookはGitHub Pages内蔵のJekyllで実現する（自前ビルドを持たない）

- **日付**: 2026-07-07
- **ステータス**: 採用
- **関連**: `_config.yml`, `docs/roadmap.md`（3つの鉄則）, [Portalの配置](20260707-portal-placement.md)

## 背景（Context）

Workspace OS構想では、Markdown（正本）から派生する「初心者にも読めるHTML Handbook」が必要。ロードマップの鉄則2「手書きの複製をゼロにする」を満たす自動変換の手段を選ぶ必要があった。

## 検討した選択肢

### 選択肢A: GitHub Pages内蔵のJekyll（`_config.yml` 1枚）

- 長所: 追加インフラ・ビルドスクリプト・外部サービス・費用すべてゼロ。Pagesの標準プラグイン（optional-front-matter / relative-links / readme-index）で既存Markdownを一切書き換えずにHTML化できる。手書きindex.html（Portal・リダイレクト）とも共存
- 短所: テーマの見た目はNESTブランドに対して簡素。Mermaid図が描画されない（コードブロック表示に劣化）

### 選択肢B: 自前の静的サイトジェネレータ（Node/Pythonスクリプト＋CI）

- 長所: 見た目を完全に制御できる
- 短所: ビルドスクリプトという保守対象が10年増える。CIビルド時間・依存の面倒を抱える

### 選択肢C: 実行時にJSでMarkdownをfetch・描画

- 短所: 外部Markdownパーサ依存またはパーサ自作。PortalのJSゼロ方針と衝突。却下

## 決定（Decision）

選択肢Aを採用。テーマは `minima`（Pages標準サポートで最も保守されている）。`header_pages` でナビの爆発を防ぐ。Mermaidの劣化は既知の制限として受容し、必要が高まったときに再検討する（原則7）。見た目の物足りなさより「保守対象を増やさない」を優先 — 派生物は消えても無傷であるべきで、凝った派生物はその原則を裏切り始める。

## 影響（Consequences）

- 良くなること: 全Markdownが自動でWebページ化され、Portalのリンク先の無骨さが根治。PDF化はブラウザ印刷で可能に
- 引き受けるリスク: GitHubがPagesのJekyllサポートを終了した場合、選択肢Bへ移行が必要（正本はMarkdownのままなので移行コストは変換層のみ）
- 覆す条件: ブランド表現の要求が高まり、テーマカスタムでは足りなくなったとき
