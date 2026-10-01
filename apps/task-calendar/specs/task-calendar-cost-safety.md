# TaskARE: 課金リスク確認と無料運用の条件

- 確認日: 2026-10-01
- 範囲: 現行コード・公式料金資料・ログイン済み管理画面の現在プラン。過去の請求額と他サービス契約は未確認。
- ユーザー条件: 自動課金のリスクを排除できないなら新しいメール機能は不要。有料化・請求先登録を勝手に行わない。

## 現行機能

| 機能 | 外部利用 | 費用上の注意 |
|---|---|---|
| テーマ・タイマー・原点ノート・端末内ハイライト | 基本はローカル処理 | 有料生成AI API呼出しを今回の監査対象コードには確認していない。保存データの同期を有効にした場合は下記Firebaseに含む |
| 個人同期・共有カレンダー・写真・プロフィール回答・日程リンク | Firebase Auth / Firestore | Sparkは無料枠の制限、Blazeは読み書き/保存等の超過分が課金対象になり得る。写真はFirestoreに保存 |
| Notion同期・Googleトークン更新 | Cloudflare Worker | Workers Freeは制限に到達すると失敗。Paidは基本料と超過料金。実アカウントの契約確認が必要 |
| 記念日通知サーバー | Worker + KV + Cron | リポジトリ記録では未設定。Freeなら枠超過時は失敗、Paidなら課金対象になり得る。実環境の公開有無は未確認 |
| Googleカレンダー/Meet | Calendar API | 標準利用枠と制限あり。2026年中の超過課金予定について公式告知あり。「永久に無条件無料」とは説明しない |
| 新しい確定メール | v108ローカル実装・未公開 | モック検証のみ、実際のGmail送信はない。URL未設定・既定無効 |

支払いAPI・プラン変更APIの呼出しは今回調べたアプリコードに見つからないが、これは既存の有料契約で利用料が発生しないことを意味しない。Notion/Workspace/ドメイン等の既存契約料金もコードだけでは分からない。

## 重要な区別

- FirebaseにCloud Billingを紐づける操作はBlazeへの自動移行につながる。無料トライアルの請求先紐づけも避ける。
- 予算アラートは通知であり、課金を強制停止する上限ではない。
- アプリ内の送信上限だけでは外部からのリクエスト課金まで防げない。Workers Paidで公開して「件数制限があるから無料」とは扱わない。
- サービスの料金は変更され得る。公開前に公式条件とアカウント設定を再確認する。

## 新機能の有効化条件

1. 対象CloudflareアカウントのWorkers Freeを実画面で確認。Freeで利用できるSQLite Durable Objects等だけを候補とする。有料プランへの変更や有料リソース追加はしない。
2. 対象Googleプロジェクトに請求先が紐づいていないことを確認。追加のGmail API認可/有効化の過程で請求先登録が必要になれば止める。既存Google連携とアカウントが同一であることも別途検証する。
3. 送信/予約数を低い値で制限し、上限到達はエラーまたは保留と表示。有料サービスへの自動切替はしない。
4. リトライ回数とMeet準備確認回数を有限にし、送信結果不明時は勝手に再送しない。期限切れ予約/保存量にも上限を設ける。
5. 上限・障害・認可失効時に追加料金で継続せず停止することをテストする。
6. FreeのCPU/保存制限で実装が動かない場合、有料化せず制約を報告し、この機能を有効にしない。

v108に保存/送信上限・有限再試行・結果不明時の自動再送停止をローカル実装してモック検証した。実際の契約監視をコードで保証するものではなく、公開前チェックリスト・実アカウントでの確認が残る。

## 実契約の確認状況

### 2026-10-01 再開後の読み取り確認

- Firebase `task-calendar-2312e`: 管理画面に「料金プラン: Spark」「無料（月額 0 ドル）」を確認。ローカル `firebase-config.js` の対象プロジェクトと一致。
- Cloudflare: `task-calendar-api` が表示されるアカウントのWorkersプラン画面で「無料」「0ドル」「現在の計画」を確認。ドメインプランではなくWorkersの契約を確認した。
- Google連携: ローカルOAuthクライアントIDの数値部分とFirebase全般設定のプロジェクト番号が一致。同じGoogleプロジェクトを使用する設定と判断。Spark表示と公式の「請求先紐づけでBlazeへ移行」の説明から、このプロジェクトに有効な従量課金の請求先は紐づいていないと判断する。Cloud Billing画面の直接確認やOAuthクライアント一覧での照合は未実施。
- 現在の無料プランを維持する限り、対象のFirestore/Workers無料枠超過は制限・失敗として扱い、従量課金で継続しない。サービスごとの制限を超えると同期等が止まる可能性はある。
- 過去の請求書、他のGoogleプロジェクト、Notion/Workspace等の契約を含めて「全サービスの請求ゼロ」とは断定しない。
- プラン変更・支払い情報入力・API有効化・追加認可・デプロイは一切していない。この確認後、自動メールをv108としてローカル実装/モックテストした。公開前に契約・アカウント・認可を再確認する。

### それ以前の経緯

初回はアプリ内ブラウザで双方ログイン画面。ユーザーからログイン完了の連絡後、Chrome側に対象FirebaseプロジェクトとCloudflareアカウントのダッシュボードタブを確認。アプリ内ブラウザとはログイン状態が別。プラン/請求/課金先紐づけ自体はまだ未確認であり、ログイン成功を無料契約の証拠にはしない。支払い情報登録・契約変更・デプロイ・権限追加は行っていない。

ユーザーの「現状を確認して次から進める」指示に従い、今回は状況整理で終了。次回はChromeの対象タブから読み取り専用でFirebase Spark/BlazeとCloudflare Workers Free/Paid（ドメインのFreeとは区別）、対象Googleプロジェクトの請求先連携を確認する。無料条件を満たすことが確認できなければ、有効化せず報告する。

## 公式資料

- [Firebase料金プラン・Spark/Blaze・予算通知](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- [Workers料金](https://developers.cloudflare.com/workers/platform/pricing/)
- [Workers Free制限](https://developers.cloudflare.com/workers/platform/limits/)
- [Durable Objects料金](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- [Gmail API制限と料金](https://developers.google.com/workspace/gmail/api/reference/quota)
- [Calendar API制限](https://developers.google.com/workspace/calendar/api/guides/quota)
- [Google Workspaceの課金変更予定](https://developers.google.com/workspace/tools-safety)
