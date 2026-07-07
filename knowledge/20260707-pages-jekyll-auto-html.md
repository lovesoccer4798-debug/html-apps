# GitHub Pagesは設定1枚で全Markdownを自動HTML化できる（Jekyll内蔵）

- **状況**: リポジトリのMarkdown文書を「初心者に優しいWebページ」として公開したかった。ビルドスクリプトや外部サービスは増やしたくない
- **結論**: ルートに `_config.yml`（テーマ指定）を1枚置くだけでよい。GitHub Pagesに内蔵されたJekyllが全MarkdownをHTMLに変換してくれる
- **理由**: Pagesでは `jekyll-optional-front-matter`（前書きなしでもページ化）・`jekyll-relative-links`（.mdへのリンクを.htmlに自動書き換え）・`jekyll-readme-index`（フォルダのREADMEをindex化）・`jekyll-titles-from-headings`（先頭見出しをタイトル化）が**標準で有効**だから

## 詳細・注意点

- `_config.yml` に `header_pages` を明示しないと、**ヘッダーのナビに全ページが並んで爆発する**（minimaテーマ）
- 手書きの `index.html` はそのまま配信される（JekyllはHTMLを壊さない）。リダイレクトやアプリと共存できる
- **Mermaid図はPages側では描画されない**（コードブロック表示になる）。GitHubのサイト上では描画される
- HTMLファイルの中から文書へリンクするときは `.md` ではなく **`.html`（またはフォルダ`/`）** で書く（自動書き換えはMarkdown内のリンクにしか効かない）

## 実際に起きた日

2026-07-07。NEST Phase 4「廊下」でHTML Handbookを実現した方法。
