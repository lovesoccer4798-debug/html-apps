# NEST 全体地図（atlas） — しくみと「なぜ」がわかるページ

> ここはNESTの**深い地図**です。[Handbook表紙](../README.md)が「今日の入口」なら、このページは「NESTがどう出来ていて、なぜそう設計されているか」を図で理解する場所です。急いでいる日は読まなくて大丈夫です。

## 図1: NESTの全体像 — 3階建てと、まわりの仲間たち

```
              +--------------------------------------+
              |  思想層 — 変わらないもの（凍結）       |
              |  Story / Manifesto / Vision /          |
              |  Brand Book / Design Principles /      |
              |  Journey                               |
              +-------------------+------------------+
                                  |  すべての判断の物差し
                                  v
              +--------------------------------------+
              |  体験層 — 人を迎えるもの               |
              |  Portal（玄関） START_HERE（10分の案内）|
              |  Handbook（毎日開くホーム）             |
              |  Dashboard（全部への近道）              |
              +-------------------+------------------+
                                  |
                                  v
              +--------------------------------------+
              |  実体層 — 育っていくもの               |
              |  Apps（Creator Studio ほか）            |
              |  Knowledge / tasks（STATUS） /          |
              |  templates / prompts                   |
              +--------------------------------------+

   いつも隣にいる同伴者:  AIパートナー（一緒に作る相棒）
                          NotebookLM（文章で質問できる先生）
```

**要約**: NESTは「変わらない思想層」を土台に、「人を迎える体験層」と「育っていく実体層」が乗った3階建て。AIパートナーとNotebookLMは特定の階に住まず、どの階でも隣にいます。（この構造の理由: [思想層の目次](../philosophy/README.md)・[ADR: philosophy-layer](../adr/20260707-philosophy-layer.md)）

## 図2: 役割の分担 — 誰（何）が、何をするのか

```
  みる      きく          つくる         そだてる       ととのえる
    |         |              |              |              |
 Handbook  NotebookLM   AIパートナー   Creator Studio   AGENTS.md
 生きた地図  質問できる先生  一緒に作る相棒  SNS投稿の      AIが従う共通ルール
 （人間向け）（人間向け）    （作業する人）  下ごしらえ道具  （AI向け）
                                                           |
                                              Navigator（育成中の思想）
                                              AI運用の設計思想。実体は
                                              まだなく、当面この役割は
                                              AGENTS.md が担っています
```

**要約**: 人間が「見る」のはHandbook、「聞く」のはNotebookLM。作業はAIパートナーが行い、その振る舞いはAGENTS.mdが律します。この責務は混ぜません — たとえばHandbookにAI向けルールを書いたり、AIに毎回Handbookを読ませたりはしません（トークン＝費用の節約でもあります）。

### Navigatorについて（正直な現在地）

Navigatorは「AIをどう運用するか」の**思想・運用設計**で、現在育成中です。アプリやファイルとしての実体はまだありません。実体ができる日まで、AI運用の正本は [AGENTS.md](../../AGENTS.md) です。この地図は実体ができたときに1行差し替えるだけで済むように作ってあります。

## 図3: 情報の流れ — 正本はいつもMarkdown

```
   【正本】 このリポジトリのMarkdownファイルたち
   （docs / knowledge / tasks / philosophy / prompts）
        |
        |  一方向にだけ流れる（逆流しない）
        |
        +--> NotebookLM …… 手動で同期して「質問できる先生」になる
        +--> Webページ  …… GitHub Pages（Jekyll）が自動でHTML化
        +--> PDF       …… ブラウザの「印刷」で作る（専用ツールなし）
```

**要約**: 書くのは常にリポジトリのMarkdown側だけ。NotebookLMやWebページは「写し」なので、明日消えても何も失われません。この一方向の流れがNESTの10年運用の生命線です。（正式ルール: [ロードマップの3つの鉄則](../roadmap.md)）

## 図4: 「1情報1正本」台帳 — どの事実は、どこを見れば正しいか

同じ事実を2箇所に書くと、必ず片方が古びて嘘をつきます。だからNESTでは、事実ごとに「正本」を1つだけ決めています。**迷ったらこの表を見てください。**

| 知りたい事実 | 正本（ここだけが正しい） |
|---|---|
| いま、なにしてる？（進捗・次の一歩） | [tasks/STATUS.md](../../tasks/STATUS.md) |
| 育成計画と完成状況（Phase） | [roadmap.md](../roadmap.md) |
| Workspace のバージョン | [GitHub Releases](https://github.com/lovesoccer4798-debug/html-apps/releases) |
| 変更の履歴 | [CHANGELOG.md](../../CHANGELOG.md)（アプリごとの履歴は各アプリに同梱） |
| AIが従うルール | [AGENTS.md](../../AGENTS.md)（ルールの索引は [governance.md](../governance.md)） |
| 場所の呼び名・一言説明 | [共通語彙台帳](../vocabulary.md) |
| 見た目の方針と値 | [デザインガイド](../design-guide.md)＋各アプリの tokens.css |
| なぜそう決めたか | [ADR](../adr/)（振り返りは [reviews/](../reviews/README.md)、困った時は [knowledge/](../../knowledge/README.md)） |
| この地図・NotebookLMの鮮度 | [Handbook表紙の品質パネル](../README.md)（鮮度情報だけはあそこが正本） |

**要約**: Handbook表紙が事実を1つも持たないのは、この台帳を守るためです。表紙は「地図」、事実は「正本」— この分担のおかげで、Handbookは更新を忘れても嘘をつきません。（設計判断の全文: [ADR: handbook-living-map](../adr/20260714-handbook-living-map.md)）

## このページの育ち方

- 図の描き替えはPhase完了のとき、構造が実際に変わった場合だけ
- 図はテキスト図で描く（GitHubでもWebページでもNotebookLMでも、同じに読めるため）。各図の下の「要約」は消さない（NotebookLMはこの要約で図を理解します）
- Handbookはこのページと表紙の2枚まで。3枚目を作りたくなったら、それは本棚の章側に書くサイン

---

Status: 実証中｜Owner: オーナー（AT-Labo）｜Review Cycle: Phase完了ごと＋月1点検（日付などの鮮度は[表紙の品質パネル](../README.md)が正本）

戻る: [Handbook表紙](../README.md)｜もっと深く: [思想層](../philosophy/README.md)・[ルール索引](../governance.md)
