# タスク: Creator Studio v1 を作る（Phase 7「最初の住人」）

- **作成日**: 2026-07-08
- **関連仕様**: `apps/creator-studio/specs/creator-studio.md`
- **優先度**: 高

## ゴール（仕様書「完成の定義」に対応）

- [ ] タイトル＋本文の入力、4媒体の単一選択、パーソナライズ設定、プロンプト生成、コピーが動く
- [ ] 設定のみ LocalStorage で自動復元（タイトル・本文は保存しない）
- [ ] 生成プロンプトがベンダー中立（どの主要AIでも自然に使える）
- [ ] 絵文字ゼロ・Lucideアイコン・tokens.css準拠・ダーク/レスポンシブ・CDN依存なし

## やることリスト（開発ステップ・各ステップで確認）

- [x] **Step 1**: 仕様書・タスク・アプリ雛形の作成（コードなし）
- [x] **Step 2**: 骨組み（HTML構造＋tokens/style・静的表示・JSなし）
- [x] **Step 3**: データ駆動（SETTINGS/MEDIA配列）＋設定UI動的生成＋Store＋buildPrompt＋生成/コピー（JS導入）
- [x] **Step 4**: プロンプト生成ロジック＋結果表示（Step 3で実装）
- [x] **Step 5**: Prompt Engine v1化（buildPrompt→PromptEngine.build・AI非依存・Connector継ぎ目）＋媒体別spec品質向上（コピーはStep 3で実装済み）
- [x] **Step 6**: UI仕上げ（見出し折返し解消・セレクト矢印・フォーカスリング・ホバー）＋Prompt Engine Roadmapコメント＋README設計方針
- [~] **Step 7**: セルフレビュー＋ADR＋CHANGELOG整理まで完了。PR/CI/mainマージはオーナー承認待ち
- [ ] **Step 8**: Portalの「育てているアプリ」に追加

## 作業ログ

### 2026-07-08

- 何をしたか: Step 1完了。`templates/app` から `apps/creator-studio/` を作成（tokens.css継承）、仕様書を確定版で配置、README/CHANGELOGをアプリ用に記述、本タスクを in-progress に作成
- 気づき: 2個目のアプリなので「はじめてモード」ではなく正式フロー（仕様書→タスク→実装）を適用。JS採用（Portalは初のJSなし→本アプリは初のJSあり）はStep 7でmini-ADR化する
- 次にやること: オーナー確認後、Step 2（HTML骨組み）へ

### 2026-07-08（Step 2）

- 何をしたか: index.html＋style.css で静的骨組みを作成（JSなし）。PC2カラム（左=作業/右=結果sticky）・スマホ1カラム・ダーク対応。媒体はラジオでJSなし選択表現、トグルはCSSスイッチ。Lucideアイコン同梱・絵文字ゼロ・tokens.css継承
- 気づき・ハマり: body と main の両方に `studio` クラスを付けて body までグリッド化しヘッダーが横に潰れた → 作業台グリッドは `.studio-grid` に改名して解消（レイアウトのクラス名は要素役割ごとに分ける教訓）。ダークは tokens.css が自動解決し手動対応ゼロ
- 次にやること: レイアウト承認後、Step 3（設定UIの動的生成＝JS導入・mini-ADR対象）へ。既知の微調整: 狭い幅で見出しと補足(hint)が窮屈 → Step 6で整える

### 2026-07-08（Step 3）

- 何をしたか: app.js を導入し4層に分離（DATA=MEDIA/SETTINGS配列 / Store=設定保存だけ / buildPrompt=純粋関数 / UI=描画とイベントだけ）。媒体・設定をHTMLから撤去し配列から動的生成。生成・コピー・LocalStorage保存/復元を実装
- 検証（Playwright）: 生成でX向けプロンプト326字を出力／口調「カジュアル」がリロード後も復元／タイトル・本文はリロードで空（信頼境界OK）／媒体選択にチェック表示
- 設計の要点: 設定追加=SETTINGS配列に1エントリ（toPrompt付き）足すだけでUI・保存・生成が自動追従。媒体追加=MEDIA配列に1エントリ。buildPromptはDOM/Storage非依存
- 気づき: ラジオを pointer-events:none で隠しているためテストは force/check が必要（実ユーザーはカードを押すので問題なし）
- 次にやること: アーキテクチャ承認後、Step 5〜6（媒体別最適化・仕上げ）、Step 7でJS採用のmini-ADR＋PR

### 2026-07-08（Step 5）

- 何をしたか: buildPrompt を **Prompt Engine v1**（`PromptEngine.build`）として明確化。AI非依存・純粋関数を設計コメントで明示し、将来の `AIConnector.send(prompt,{model})` を Engine の外側に足す継ぎ目をコメントで用意（Connector自体は作らない＝原則7）。媒体別spec（Note/X/Threads/リール）を「その媒体らしい」出力になるよう全面改稿
- 検証（Playwright）: 4媒体すべてで媒体固有の指針が出力（Note=構成/X=280字・連投・ハッシュタグ2個/Threads=口語・共感/リール=台本・フック・テロップ・キャプション）。Engineロジックは無変更でdataだけ更新＝データ駆動の実証
- Output Profile（Phase 2）: SETTINGS配列に1エントリ足すだけで乗ることをコメント例で明示。Prompt Engineは無変更で対応可
- 次にやること: 承認後 Step 6（レスポンシブ・見出し窮屈の微調整）→ Step 7（JS採用mini-ADR＋PR/CI/マージ）→ Step 8（Portal掲載）

### 2026-07-08（設計追記＋Step 6）

- 設計追記: app.js に Prompt Engine Roadmap（v1生成→v2 Output Profile→v3 Connector→v4 Workflow/MCP）をコメントで記載。README に「Prompt Engine中心・Connectorは外側に足す」基本方針を一文追加（いずれも実装なし・思想の記録）
- Step 6（UI仕上げ）: panel-headをflex-wrapにし見出しの途中折返しを解消（補足は下段へ回り込み）。selectにカスタム矢印、input/textarea/selectにフォーカスリング、媒体カードにホバー/フォーカス表現。PC/スマホ/ダーク3種スクショで確認
- 次にやること: 承認後 Step 7（セルフレビュー＋JS採用のmini-ADR＋CHANGELOG/STATUS→PR/CI/mainマージ）→ Step 8（Portal掲載・バッジ🐣→🐦）

### 2026-07-08（Step 7・PR前レビュー）

- ADR: `docs/adr/20260708-creator-studio-vanilla-js.md` 作成（Vanilla JS採用・React/Vue/Alpine不採用の理由・依存ゼロを保つ理由・将来フレームワークを検討するトリガー条件まで）
- CHANGELOG: 将来予定を排し「実際に入った変更のみ」に整理。[1.0.0] として確定（ロードマップ/設計コメントとの責務分離）
- セルフレビュー（Step 1〜6総ざらい）で2件検出・修正:
  1. 古いコメント「buildPrompt」→「PromptEngine」に修正
  2. 堅牢性: 設定のテキスト値を innerHTML に素で差し込んでいた → esc() を追加。`36"モニター <script>` で検証し、保存/復元・マークアップ無崩れ・script非混入・生成へテキスト安全反映を確認
- CSS未使用セレクタ: 照合の結果ゼロ。ICONS(JS)とHTML内SVGの一部重複は「静的chrome=HTML/動的=JS」の意図的分離として許容（統一は複雑化に見合わず）
- 次にやること: オーナー承認後、PR作成→CIグリーン確認→squashでmainマージ → Step 8（Portal掲載）
