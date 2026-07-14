# NEST Handbook — 生きた地図

> ここは**毎日開くホーム**です。いまの現在地と、やりたいことへの入口が、この1枚にあります。説明書ではありません — 全部読むものではなく、開いて、押して、始めるためのページです。

## Today — いま、どこにいる？

| 知りたいこと | 答え |
|---|---|
| いま使えるもの | [Creator Studio](../apps/creator-studio/index.html)（SNS投稿の下ごしらえ）／[Portal](../apps/portal/index.html)・[Dashboard](../apps/portal/dashboard.html)／この地図 |
| できあがり具合 | ロードマップ10段階のうち**9段階が完了**（残りは Phase 8「巣立ちの準備」）→ 詳細は [ロードマップ](roadmap.md) |
| きょうの続き・次の一歩 | [STATUS を開く](../tasks/STATUS.md)（30秒。「いま、なにしてる？」がいつも書いてあります） |

## やりたいことから探す

どの行き先も**2クリック以内**で「触れるもの」に着きます。名前を覚えていなくて大丈夫です。

| やりたいこと | 行き先 |
|---|---|
| SNS投稿をつくりたい（3分・素材を貼るだけ） | [Creator Studio](../apps/creator-studio/index.html) |
| AIと一緒に何かをつくりたい | [first-app — コピペで始まる声かけ文](../prompts/first-app.md) |
| いまの進捗・完成状況を知りたい | [STATUS](../tasks/STATUS.md) と [ロードマップ](roadmap.md) |
| 質問したい・意味を知りたい | NotebookLM に聞く（まず「NESTの六箇条は？」と聞いてみてください。[設定と使い方](ai-tools.md)）／言葉なら [用語集](glossary.md) |
| 困った・つまずいた | [Knowledge — 先輩の転んだ跡](../knowledge/README.md) |
| しくみと「なぜ」を知りたい | [全体地図（atlas）](handbook/atlas.md) と [思想層](philosophy/README.md) |
| はじめて来た・人に渡したい | [START_HERE — 10分の案内](../START_HERE.md) |

## 3つの入口の見取り図

```
はじめての人                     毎日のあなた
     |                               |
     v                               v
 [ Portal ]  ------------->  [ Handbook ] ←― いまここ
  玄関。NESTを初めての人に      毎日開くホーム。現在地と
  紹介する面                    「やりたいこと」からの入口
     |                               |
     v                               v
 [ START_HERE ]              [ Dashboard ]
  10分の案内。                  全部への近道。すべてへ
  最初の一歩はここから          2クリックで跳ぶリンク集
                                     |
                                     v
                    Apps（Creator Studio ほか）・STATUS・
                    Knowledge・Handbookの各章 …
```

**迎えるのがPortal、帰るのがHandbook、跳ぶのがDashboard。** はじめての人はPortalからSTART_HEREへ。2回目からはこのHandbookをホームにして、急ぐ日はDashboardから直接跳んでください。もっと詳しい地図（責務分離・情報の流れ・「なぜこう設計されているか」）は [atlas](handbook/atlas.md) にあります。

## 品質パネル — この地図は信じられるか

| 確認したいこと | いまの状態 |
|---|---|
| この地図の最終更新 | **2026-07-14**（この行が正本。Phase完了ごとに更新されます） |
| Workspace Version | [Releases で確認](https://github.com/lovesoccer4798-debug/html-apps/releases)（手書きしないので、常に正確です） |
| 自動検査（CI） | [![CIの状態](https://github.com/lovesoccer4798-debug/html-apps/actions/workflows/ci.yml/badge.svg)](https://github.com/lovesoccer4798-debug/html-apps/actions)（リンク切れ・秘密情報を毎回自動検査） |
| NotebookLM同期 | 未実施（初回同期がまだです。同期したらこの行に日付が入ります） |
| レビュー記録 | [Phase 9 まで記録あり](reviews/README.md)（Phase 7分は未記録 — STATUSに申し送り済み） |

この表の見方: 上2行が「地図そのものの鮮度」、下3行が「Workspaceの品質」です。日付が3ヶ月以上古いときは、月1点検（[手順](ai-tools.md)）のサインです。

## しくみとルールの本棚

必要になった章だけ、必要になったときに。

| 章 | 内容 |
|---|---|
| [ものづくりの流れ](development-flow.md) | アプリ作成→仕様→タスク→実装→リリース（はじめてモード含む） |
| [Gitとの付き合い方](git-workflow.md) | ブランチ・コミット・マージの約束 |
| [書き方のルール](coding-standards.md) | コーディング規約 |
| [テストと動作確認](testing-policy.md) | 何をどこまで確認するか |
| [レビューのしかた](review-process.md) | セルフレビュー・初心者テスト・引き算のレビュー |
| [AIと働く](ai-tools.md) | AIツールの案内・NotebookLM同期・[AGENTS.md（AI向けルール）](../AGENTS.md) |
| 記録の残し方 | **ADR＝なぜそう決めたか**（[adr/](adr/)）／**Reviews＝あとから振り返る記録**（[reviews/](reviews/README.md)）／**Knowledge＝困った時の助け**（[knowledge/](../knowledge/README.md)） |

**付録**: [ルール索引（Governance Index）](governance.md)｜[ロードマップ](roadmap.md)｜[用語集](glossary.md)｜[共通語彙台帳](vocabulary.md)｜[デザインガイド](design-guide.md)｜[人間にしかできない操作](human-only-operations.md)｜[Starter Kit — NESTのDNA](starter-kit.md)｜[思想層](philosophy/README.md)

## この地図の育ち方

- **動くのはPhase完了のときだけ。** 更新するのは「Today」と「品質パネル」の数行（作業したAI・人が、Phase完了レビューとセットで更新します）
- **事実はここに書かない。** 進捗はSTATUS、計画はroadmap、バージョンはReleasesが正本。この地図はそこへ案内するだけなので、古びても嘘をつきません（設計の理由: [ADR](adr/20260714-handbook-living-map.md)）
- **増やさない。** Handbookはこの表紙と [atlas](handbook/atlas.md) の2枚まで。書きたいことが増えたら、上の本棚の章側に書きます

---

戻る: [README（全体像）](../README.md)｜はじめての方: [START_HERE](../START_HERE.md)
