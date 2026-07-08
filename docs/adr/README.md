# docs/adr/ — 設計判断の記録（ADR）

> 🧭 ここは「**なぜそう決めたか**」の置き場です。ライブラリ選定・構造の変更・ルールの改定など、あとから「なぜ？」と聞かれる判断の理由が、1判断1ファイルで残っています。

## 読み方

- ファイル名は `YYYYMMDD-短い英語スラッグ.md`（日付順に並びます）
- 各ファイルは「背景 → 検討した選択肢 → 決定 → 影響」の順で書かれています
- 一覧は [GitHubのフォルダ表示](https://github.com/lovesoccer4798-debug/html-apps/tree/main/docs/adr) がいちばん見やすいです

## 書き方

`templates/adr.md` をコピーして作ります。詳しくは [Handbook表紙](../README.md) の第8章へ。

**ADRは重くなくてよい（mini-ADR）。** テンプレートは目安です。小さな決定は「背景・決定・影響」を数行書けば十分。"ADRは大げさ"と感じて記録をやめるより、短くても残すほうが価値があります。

## 決定の行き先（どの記録に書くか）

| 決定・記録の種類 | 置き場 |
|---|---|
| Phase作業の中での採用・却下 | その Phase の [Review](../reviews/README.md) |
| 長く効く設計・技術・ルールの選択 | **ADR**（短くてよい＝mini-ADR） |
| 恒久的なルール・手順 | [Handbook](../README.md)／[AGENTS.md](../../AGENTS.md) |
| ハマった問題と解決法 | [Knowledge](../../knowledge/README.md) |
| いまの進捗 | [STATUS](../../tasks/STATUS.md) |

**記録の3兄弟**: ADR＝なぜそう決めたか／Reviews＝あとから振り返る記録／Knowledge＝困った時の助け。（「日々の軽い決定記録（Decision Log）」は足さない — mini-ADRで足りるため。判断: [ADR](20260708-decision-record-routing.md)）

---

📍 **戻る**: [Handbook表紙](../README.md)
