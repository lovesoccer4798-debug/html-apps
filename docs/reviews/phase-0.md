# Phase 0 レビュー記録 — 思想層

- **日付**: 2026-07-07
- **成果物**: `docs/philosophy/`（6文書＋玄関README）、[ADR: 思想層の配置](../adr/20260707-philosophy-layer.md)

## 目的

NESTのすべての判断基準となる思想層（Story・Manifesto・Vision・Brand Book・Design Principles・Journey）を完成させ、リポジトリに一次文書として格納する。

## レビュー結果

- 自己レビューで不足3件を検出: Vision/Story未執筆、文書間ナビの欠如、AGENTS.md（法律）から憲法への参照欠如 → すべて実装で解消
- ChatGPTレビュー: 「思想層として十分な完成度」の評価。改善提案3件（凍結・North Star・円環Journey）→ Phase 1で採用

## 採用

- 思想層は6文書で完結し、7つ目は作らない（問いの完備性による）
- 文書ごとの比喩の固定（心・旗・望遠鏡・憲法・定規・地図）
- Journeyの個人進捗はファイル化せずSTATUSに一行（不変の思想と日々変わる状態の分離）
- Level 7を「Starter Kitを作る」から「巣立ち — 自分の巣をつくる」へ再定義（事業目標と成長目標の分離）

## 却下

- 思想層を `docs/brand/` に置く案（Design Principles・Journeyがブランドより広い概念のため）
- リポジトリ直下への配置案（ルートの散らかり防止）

## 理由

判断基準が確立していない状態で実体（Portal・Handbook）を作ると、後からすべて作り直しになる。思想→体験→実体の順は、Brand Philosophy「安心して創造し」の土台をまず固める順序である。
