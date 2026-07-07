# Phase 5 レビュー記録 — ダッシュボード

- **日付**: 2026-07-07
- **成果物**: `apps/portal/dashboard.html`（＋`style.css` 分離・Portal v1.2.0）、`docs/adr/README.md`、語彙台帳への「4つの役割」正式定義、`apps/portal/specs/dashboard-v1.md`

## 目的

毎日使う人（2回目以降）が、既存のすべての情報へPortalから2クリック以内で到達できるホームを作る。**新機能は増やさず、情報の整理だけを行う**（オーナー指定の完成条件）。

## レビュー結果

- 主要13項目（Dashboard自身・Version・STATUS・Apps一覧・Journey・Knowledge・ADR・Reviews・AI切替ガイド・NotebookLM・Git状態・CI状態・Handbook）の到達クリック数を机上検証: **すべてPortalから2クリック以内**（Portal→Dashboard→各項目）
- 事前レビューで障害1件を検出・解消: `docs/adr/` にREADMEがなくPages上でフォルダリンクが404になる → README新設（記録の3兄弟の説明付き）
- スクリーンショット検証: デスクトップ・ダークモードとも表示良好。Portalヘッダーの2ボタン（はじめて／2回目以降）も自然

## 採用

- **4つの役割の正式定義**（語彙台帳に固定）: Portal＝初めて来た人の入口／Dashboard＝毎日使う人のホーム／Handbook＝学ぶ場所／Knowledge＝困った時の辞書
- **Dashboardは6つ目の「場所」にしない**: START_HEREの「中身は5つだけ」の約束を守るため、Portalの2ページ目（同じ建物の別の入口）と位置づけた
- CSSを `style.css` に分離（2ページ共有。「規模が育ったら分割する」の規約どおりの成長）
- Workspace Versionの**数字を手書きしない**（リリースごとに古くなる嘘の温床。CHANGELOG/Releasesへのリンクで代替 — 鉄則2）

## 却下

- 検索・動的表示・自動生成などの新機能（オーナー方針どおり。情報整理のみ）
- NotebookLMノートブックへの直接リンク（URLが個人アカウント依存でStarter Kit複製時に壊れる。同期フロー文書へのリンクで代替）

## 理由

「毎日の人」の摩擦は機能不足ではなく「どこにあるか思い出せない」こと。整理だけで解決するなら、それが最小の手（原則7）。

## 残作業（オーナー確認）

- [ ] Pages有効化後、Dashboard実表示と全リンクの到達確認
