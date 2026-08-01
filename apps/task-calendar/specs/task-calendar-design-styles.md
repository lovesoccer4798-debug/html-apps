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

## 背景がグラデーションのテーマでの固定ヘッダー（v94）

Cloud Candy と Aurora Orbit は `body::before` に画面いっぱいのグラデーションを敷いている。一方で固定ヘッダー（`#scr-cal .appbar`）とフィルタ行（`.cal-chips`）は `background: var(--tc-bg)` の**単色**で塗っていた。

`--tc-bg` はグラデーションの**開始色**なので上端では一致するが、下へ行くほどグラデーションだけが変化するため、**ヘッダーの範囲が四角い板として浮いて見える**（スクロールでも一緒に動く）。

対応: この2テーマでは、ヘッダーとフィルタ行を**透明＋すりガラス**（`backdrop-filter`）にする。

- 止まっているときは背後のグラデーションがそのまま透けるので、境目が出ない
- スクロールで下に潜った文字は、ぼかしと薄い色（`--tc-bg` 42%）で読めなくなる
- **`backdrop-filter` は `position: fixed` の子要素の基準位置になる**ので、「上のバーだけ固定」モードでは `.appbar` ではなく、実際に `fixed` になっている `.appbar-top` の側に掛ける

## ステータスバーの帯の色（v94→v95で修正）

### 正しい仕組み

iPhoneのホーム画面アプリ（standalone・`apple-mobile-web-app-status-bar-style` は既定）では、**`<meta name="theme-color">` は使われない**。帯は**ページの canvas（`<html>` の背景色。無ければ `<body>` から伝播した色）**で塗られる。

v94で meta を動的にしたが、iOSでは効かなかった。**v95が本当の対応**。

### 症状の切り分け

`body { background: var(--tc-bg) }` があるので、ふつうのテーマは body の色が canvas に伝播して馴染む。ところが **Cloud Candy と Aurora Orbit は `body { background: transparent }`**（グラデーションを `body::before` で描くため）にしていたので、canvas に色が無く**白いまま**になっていた。これが「テーマによって浮いたり浮かなかったりする」の正体。

### 対応

1. `html { background: var(--tc-bg); }` を入れて、**どのテーマでも canvas に色がある**状態にする（`--tc-bg` はどのテーマでも画面いちばん上の色＝グラデーションの開始色と一致している）
2. タイマー（フォーカス）画面のあいだは、`applyThemeColor()` が `<html>` の背景色をそのデザインの上端の色（`TIMER_TOP`）で**インライン上書き**する。閉じたらインラインを外してCSSに戻す
3. `theme-color` の meta も同じ色に更新し続ける（Android/Chrome では有効なため）

タイマーを開いている最中にテーマや配色を変えても帯が戻らないよう、`applyThemeColor()` は「フォーカス画面が開いているか」を見てから色を決める。
