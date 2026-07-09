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
- [~] **Step 4**: プロンプト生成ロジック＋結果表示（Step 3で先行実装済み・媒体別の文言微調整が残）
- [ ] **Step 5**: コピー機能＋媒体別の最適化（コピーはStep 3で実装済み・媒体別最適化を詰める）
- [ ] **Step 6**: レスポンシブ・ダーク・アイコン仕上げ
- [ ] **Step 7**: セルフレビュー＋動作確認＋CHANGELOG/STATUS→コミット/PR/CI/マージ＋mini-ADR（JS採用）
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
