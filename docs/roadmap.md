# NEST ロードマップ — Workspace OS構想

> 🧭 ここはNESTの**育成計画の正本**です。Phaseの追加・変更はこのファイルを更新し、完了したPhaseのレビューは `docs/reviews/` に記録します。

## 最終イメージ — 正本と派生の一方向アーキテクチャ

```
【正本】 Markdown（docs・knowledge・philosophy・tasks — このリポジトリ全体）
   │
   ├─→ 📓 NotebookLM …… 質問できる先生（手動同期・読む専用）
   ├─→ 🌐 HTML …… Portal（玄関・手書き）＋ Jekyll自動変換（廊下・全Markdownを自動でWebページ化）
   └─→ 🖨 PDF …… 印刷用CSS＋ブラウザの「PDFに保存」（専用ツールなし）
```

### 3つの鉄則（10年運用の生命線）

1. **正本はMarkdownだけ。** 派生物（NotebookLM・HTML・PDF）に直接書かない。派生物は明日消えても何も失わない
2. **手書きの複製をゼロにする。** 派生は自動変換（GitHub Pages内蔵のJekyll）に任せる。手で写した瞬間から乖離が始まり、正本より派生物が嘘をつくようになる
3. **動的情報（CI状態・バージョン等）は自前実装しない。** GitHub公式バッジとリンクで足りる。API・トークンを10年抱え込まない

## Phase一覧

| Phase | 名前 | 中身 | 完成条件 | 状態 |
|---|---|---|---|---|
| 0 | 巣の設計図 | 思想層6文書（凍結済み） | 判断基準がリポジトリだけで分かる | ✅ |
| 1 | 歓迎キット | START_HERE・hello-nest・first-app・語彙台帳 | 15分でAIと挨拶→Level 1 | ✅ |
| 2 | 安心の備蓄 | knowledge種まき・用語集・人間専用操作・レビュー文化 | 困った人が5分で先輩の跡を発見 | ✅ |
| 3 | 玄関 | Portal v1（apps/portal/・正式フロー・初心者テスト） | 公開URLでPortalが開く | ✅（Pages有効化待ち） |
| 4 | 廊下 | Jekyll有効化で全MarkdownをHTML化・Portalリンク差し替え・CIバッジ・印刷CSS | 初心者が**GitHubのUIを見ずに**Handbook/Knowledge/Journeyを読み回れる。ブラウザ印刷でPDF化できる | ✅（Pages上の実表示はオーナー確認待ち） |
| 5 | ダッシュボード | Portal拡張（Version・STATUS要約・ADR/Reviews/AI切替/NotebookLM入口・一覧の更新漏れ対策） | 主要13項目すべてにPortalから**2クリック以内** | ⬜ |
| 6 | 最初の住人 | 実用アプリ第1号（オーナーのJourney Level 3体験）＋Experience Review 2.0 | North Star第1指標（公開アプリ）が1になる | ⬜ |
| 7 | 巣立ちの準備 | Starter Kit実装（`docs/starter-kit.md` のDNA定義に従い `nest-starter` を作成） | 第三者が15分で自分の巣を作れる | ⬜ |

## 優先順位の理由

- **4（廊下）を5（ダッシュボード）より先に**: 設定ファイル1枚で「リンク先の無骨さの根治・HTML Handbook・PDF」の3つが同時に手に入る最小手。廊下がないとダッシュボードの行き先が無骨なまま
- **6（住人）を7（巣立ち）より先に**: 実績のないDNAを配らない。オーナー自身のLevel 3体験が最初の実績になる
- **却下済みの誘惑**: Git/CI状態の自前ダッシュボード（バッジで代替）、PDF生成パイプライン（印刷CSSで代替）、アプリ一覧の自動生成（10個まで手動）

## Phase 4の実装ステップ（次回）

1. `_config.yml` 追加（Pagesテーマ＋ `jekyll-relative-links` で .mdリンクを自動変換）
2. 主要ドキュメントの表示確認・崩れの微修正
3. Portalの5枚カードのリンク先をHTML版URLへ差し替え
4. CIバッジをPortalに設置（GitHub公式バッジSVG）
5. 印刷CSS（`@media print`）
6. 初心者テスト→ `docs/reviews/phase-4.md` に記録

## Future — Version 2以降の余白（実装も設計もしない）

NESTはいま **Developer OS** として育っている。思想層は「つくること」全般の言葉で書かれており、アプリ以外の創造物（文章・動画・イベント・知識）を育てる **Creator OS** へ育つ扉は、最初から開いている。

```
Developer OS（いま） ──→ Creator OS（いつか）
```

この一行以上のことは、その日が来るまで書かない（Design Principles 原則7「育つ余白を残す」）。着手を決めたときに初めて、Visionの一語改正（「アプリ」→「作品」、Version 2.0の憲法改正）とともに正式なPhaseとして起票する。

## このロードマップの育て方

Phaseの完了ごとに状態列を更新する。Phaseの追加・入れ替えはオーナーの承認を得て、このファイルの更新＋該当Phaseレビューへの記載で行う。将来の可能性（Creator OS等）はVisionの余白として保持し、ここには**着手が決まったものだけ**を書く。

---

📍 **関連**: [Handbook表紙](README.md)　|　[STATUS（作業の現在地）](../tasks/STATUS.md)　|　[Vision（望遠鏡）](philosophy/vision.md)
