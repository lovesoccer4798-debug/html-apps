# Task Calendar — 見た目のカスタマイズ 仕様（未実装・実装メモ）

- **ステータス**: 未実装。Notion連携のあとに着手予定
- **関連**: デザイン案プレビュー（claude.ai/code/artifact/c9065c7d-184f-483e-822c-3f6130cfac7b）

## 2軸に分ける（別々の設定にする）

### A) スタイル変更（設定名: 「スタイル変更」）— 採用が確定した2つ

同じレイアウト・同じ色・全機能そのままで、**角丸・影・線・余白トークンだけを一式上書き**する軽い切替。
`:root[data-style="..."]`（`db.settings.styleVariant`、既定 `'round'`）。

- **まる（今のまま）** = 既定（`round`）: 現状のトークンそのまま
- **カクカク**（`square`）= 採用: `--tc-r-card:4px` `--tc-r-pill:6px` `--tc-r-cell:3px`、影を最小、`--tc-line`の枠線をカードに付与、余白やや詰め、チェック/FABを角丸4〜6px
- **くっきり**（`crisp`）= 採用: `--tc-r-card:12px` `--tc-r-pill:10px`、枠線1.5pxで強め・コントラスト高め、影やや強め、FAB/チェックは丸のまま

（「ミニマル」はプレビューのみ・今回不採用。トークン値はArtifactの `.app.square` / `.app.crisp` を移植すればよい）

実装: tokens.css に `:root[data-style="square"]{...}` `:root[data-style="crisp"]{...}` を追加。app.jsに `applyStyle()`（`document.documentElement.dataset.style = db.settings.styleVariant`）＋設定にセグメント（まる／カクカク／くっきり）。init/applyThemeと並べて呼ぶ。追加のみ・ロールバック容易。

### B) デザイン変更（設定名: 「デザイン変更」）— 将来・全く違う見た目を複数

Claude Designで作った**別の視覚アイデンティティ**（配色・タイポの雰囲気・コンポーネントの質感が根本的に違うもの）を、今のフォーマット（レイアウト・機能）を保ったまま**リスキンとして**追加する。
`:root[data-design="..."]`（`db.settings.designPack`、既定 `'default'`）。

- 各デザイン = 色/フォント/角丸/影/余白まで含む**トークン一式**を丸ごと定義（tokens.cssに `:root[data-design="X"]{ 明/暗それぞれ }`）
- 現状は `default`。案A/B/Cを足す形。**スタイル変更(A)と併用可**（デザインの上でさらに角丸だけ変える等）
- 注意: レイアウト自体を変える案（ナビ位置や構造が違う等）はトークンだけでは足りず、そのデザイン限定の追記CSS（`:root[data-design="X"] .xxx{...}`）が要る。リスキン方針（同じ骨格で見た目だけ変更）に寄せれば低リスク

実装順: Notion連携 → A(スタイル変更: カクカク/くっきり) → B(デザイン変更: Claude Designの案を確定してから)。

## 完成の定義

- [ ] 設定に「スタイル変更」（まる/カクカク/くっきり）。既定は今のまま・選んだ時だけ変わる
- [ ] （将来）設定に「デザイン変更」（デフォルト＋追加案）。現行フォーマットを保ったリスキン
- [ ] 追加フィールドのみ（styleVariant / designPack）でクラウド同期・後方互換。全回帰PASS
