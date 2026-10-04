# STATUS — 現在地スナップショット

> **このファイルはワークスペースの「現在地」を示す最重要ファイル。**
> どのAI・どのセッションでも、作業を終えるときに必ず更新すること（`AGENTS.md` 参照）。
> 詳細は書かない — このファイルは薄い索引に保ち、詳細は各タスクファイルの作業ログに書く。

- **最終更新**: 2026-10-04
- **現在の正本（UID登録後）**: [PR #92](https://github.com/lovesoccer4798-debug/html-apps/pull/92)作成済み、未マージ。OWNER_UIDを含む3秘密設定の名前、GoogleリダイレクトURI、Workers Freeを確認。独立Workerの本人認証付きAPIを有効化し、未認証401・許可外Origin403を確認。単体15件・v108画面回帰成功。次はPRマージ→設定のGoogle追加連携を本人操作→本人宛実送信検証。本人UIDの正しさは実ログイン時に確認、追加同意/実送信は未完了。以下の過去の引き継ぎより本行を優先する。
- **最新の引き継ぎ（UID待ち）**: GOOGLE_CLIENT_SECRET登録を名前のみで確認。TOKEN_KEYを暗号学的乱数32バイトから生成し、値を表示/ファイル保存せず秘密登録。2つともsecret listで保持確認。公開Firebaseキーを反映し、OWNER_UIDの空通常変数を削除（秘密に切り替えるため）。CloudflareのOWNER_UID秘密フォームとFirebase Authenticationユーザー画面を開き、本人のUIDのコピー・登録を本人へ引き継ぎ。自動送信フラグはfalseのまま。次はOWNER_UID登録確認→リダイレクトURI確認→本人限定のGoogle追加同意・本人宛テスト。
- **最新の引き継ぎ**: 専用Google OAuthクライアント「TaskARE 自動案内」の作成を一覧で確認。クライアントIDとPUBLIC_URLを独立Workerに反映済み（両フラグfalse）。Cloudflare設定でGOOGLE_CLIENT_SECRETの名前・秘密チェックだけ準備し、値入力と「変数を追加してデプロイする」を本人へ引き継ぎ。秘密値は読み取らない。次は登録名だけで確認し、TOKEN_KEY・所有者UID・Firebase公開キー・Google追加同意・本人宛テストへ進む。
- **認証・公開の最新状況**: 10/4、明示承認後にWrangler認証成功（account/user参照・workers_scripts更新・継続アクセスのみ、Keychainで鍵を管理）。Workers Freeを再確認し、独立`taskare-booking`を無効状態で公開。https://taskare-booking.love-soccer4798.workers.dev が503 setup_requiredを返すことを確認。既存Worker・料金プラン変更なし。次は専用Google OAuthクライアントの本人作成、秘密登録、所有者設定、追加同意と本人宛テスト。
- **最新の費用確認**: 自動案内の公開・Google追加同意について、無料を条件に進めたいとの依頼。公式料金を再確認し、Workers Free維持・Google請求先未連携・有料化が必要なら停止の条件を説明。Gmail/Calendarは標準利用追加料金なしだが2026年後半の上限超過課金を予告しており、永久無料は保証しない。この確認では公開・認可・実送信なし。次は公開前チェックリストに沿って実契約とPR状態を再確認する。
- **最新の相談**: 無料条件で自動案内の公開準備を開始。`codex/taskare-booking-activation`。実画面でWorkers Free / Firebase Spark / Google請求先未連携を確認済み。本人操作後、Gmail API「有効」を実画面で確認。次はWrangler認証と独立Workerの無効状態での準備。公開前の正本: `apps/task-calendar/booking-worker/README.md`。
- **更新者メモ**: [PR #91](https://github.com/lovesoccer4798-debug/html-apps/pull/91)は10/1マージ済み、Pages成功・既存task-calendar-apiビルド失敗。単体15件再成功。Gmail API有効化済み、Google OAuthは外部・本番環境。独立Workerのみ無効状態で公開済み。Google追加同意/秘密登録/実送信なし。ローカルwrangler.jsoncのPUBLIC_URLは実URLへ更新したが、初回クラウド設定はexample.invalidのまま（無効なので動作に影響なし）。通知サーバー未設定、実機iPhone未確認。

## ワークスペース全体の状態

Workspace v1.0.0 リリース済み。**NEST Phase 0〜7が完了、Phase 9「生きた地図」が実証中**（残りはPhase 8「巣立ちの準備」）。人間向けの入口が Handbook（生きた地図）に一本化され、迎える=Portal／帰る=Handbook／跳ぶ=Dashboard の3ホーム体制になった。実証の計画は `docs/reviews/phase-9.md` 参照。

## プロジェクト索引

| アプリ | 状態 | 一言メモ |
|---|---|---|
| 🏠 [Portal](../apps/portal/README.md) | 🐦 そだち | NEST初のアプリ。玄関＋Dashboard（v1.5.0 — 3ホーム再定義を反映） |
| [Creator Studio](../apps/creator-studio/README.md) | 🐦 そだち | 素材から各AIへ渡すベンダー中立プロンプトを生成（Phase 7・v1.0） |
| [Task Calendar](../apps/task-calendar/README.md) | 🐣 ひな | 個人用タスクカレンダー・PWA。作業版v108自動案内をローカル検証、公開設定待ち |

（Handbookはアプリではなく `docs/` の一部。入口は [Handbook表紙](../docs/README.md)）

## 進行中のタスク

- [Handbook実証フェーズ — 開始チェックリストと終了条件](in-progress/20260714-handbook-validation.md)（主担当: オーナー。実証の正本はこのファイル）
- [Task Calendar v1](in-progress/20260714-task-calendar.md)（PR #90はマージ済み。v108はローカル検証済み、日程案内はアカウント確認・公開設定・実送信検証が必要。Portal掲載の要否はオーナー判断）

## 次にやるべきこと

1. **[実証開始チェックリスト](in-progress/20260714-handbook-validation.md)を上から進める**（PR→mainマージ→Pages有効化→NotebookLM同期→質問検収5問→実証開始宣言→7日間の実運用）
2. **Creator Studioを実運用で育てる**（実証終了条件の1つ: 5回以上の実戦使用）
3. **初見ユーザーテスト**（実証終了条件の1つ。知り合いに渡して10分観察）
4. **実証ログを1日1〜3分つける**（チェックリスト内の表。7日後のレビュー材料）
5. 終了条件6つがすべて揃ったら**Phase 9正式採用**（roadmap✅・品質パネル「正式採用」・タスクをdoneへ）
6. 保留のオーナー判断: Phase 8の着手時期／アプリ単位のタグ運用の要否／CHANGELOG `[Unreleased]` のv1.1.0繰り上げ（リリースを切る好機）

## 注意点・申し送り

- **思い出シェアカレンダー（v87）はFirebaseのルール追加が必要**。`shared/{calId}/photos/{photoId}` に read/write の許可を足さないと写真の保存だけが失敗する（正本: `apps/task-calendar/specs/task-calendar-memories.md`）。写真はCloud Storageではなく Firestore に入れているので、Blaze（従量課金）への切り替えは不要

- **鮮度情報の正本はHandbook品質パネルへ移設**（NotebookLM同期日はSTATUSではなく[Handbook表紙](../docs/README.md)の品質パネルに記録する。ADR: 20260714-handbook-living-map）
- **Phase 7のレビュー記録（docs/reviews/phase-7.md）が未作成**。遡って書くか欠番として扱うかはオーナー判断（reviews/READMEに注記済み）
- 価値判断は `docs/philosophy/brand-book.md`（憲法）と `design-principles.md`（定規）が最上位（AGENTS.md §1に明記済み）
- Journeyの個人進捗はこのSTATUSに一行で記録する方式（例: `Journey: Level 3`）。専用ファイルは作らない
- 新しいAIツール導入時: スタブ追加＋ `docs/ai-tools.md` 更新／新スタック採用時: `docs/coding-standards.md` 追記
- LICENSE は MIT を仮採用中。本格公開前に要確認
- クラウドセッションからタグはpush不可。タグ・リリースはGitHubのReleases画面から（`docs/ai-tools.md` 参照）
