# 日程確定・Gmail案内サーバー（未公開）

Workers Free + **SQLite** Durable Objectの単一オーナー向け実装。ローカルのテストは外部APIをモックし、実際のメール送信・API有効化・デプロイは行わない。既存Notion Worker、通知Worker、Firestoreルールとは分離している。

## 無料運用の境界

- Workers Freeを維持する。CloudflareのドメインFreeとは別に確認する。
- GoogleプロジェクトはSpark/請求先未連携を維持する。無料トライアルを含め、請求先登録を求められたら停止する。
- 上限到達時は停止し、課金して継続する実装はない。ただしコードが契約プランの変更を防ぐわけではない。公開前/契約変更時に実契約の再確認が必要。
- 50件保持、1日10リンク、1日10送信試行、1予約最大3送信試行。日次制限はUTCでリセット。全HTTPリクエストは1時間600件（所有者・回答者で共有）。期限削除は最終候補の7日後。
- API結果不明・無料サービス制限・再認可要求で案内が止まる可能性がある。Gmail送信結果不明時は送信済みを人が確認するまで再送しない。

## 公開前チェックリスト

1. 実契約と[課金監査](../specs/task-calendar-cost-safety.md)を再確認する。実機検証・公開・Google追加権限はオーナーの確認を受ける。
2. `wrangler.example.jsonc`からローカル専用`wrangler.jsonc`を用意する（gitignore済み）。`ENABLED=false`、`FREE_PLAN_CONFIRMED=false`のまま準備する。
3. Google Calendar API、Gmail API、OAuthウェブクライアントと同意画面を確認する。有効化/リダイレクトURI変更は別途確認。テスト中なら送信者をテストユーザーに登録する。外部公開の審査やテストモードの更新トークン期限に注意する。
4. `GOOGLE_CLIENT_ID`、Firebaseの公開Web APIキー、オーナーのFirebase UID、`APP_URL`（公開HTTPSのindexページ）、`PUBLIC_URL`（Worker origin・末尾スラッシュなし）を設定する。Firebase AuthはGoogleログインを使用する。APIキーのAPI制限がIdentity Toolkitを許可するか確認し、保護設定を勝手に緩めない。
5. OAuthクライアントに`PUBLIC_URL/oauth/callback`を登録する。追加スコープは`openid email calendar.events gmail.send`。**既存のGoogleカレンダー連携とFirebaseログインが同じアカウントか、実画面で確認する**。実装はFirebase側のGoogle主体と追加認可の主体を照合するが、旧カレンダー認可には主体情報がないため、旧連携との同一性をコードだけで証明できない。
6. Worker secretsで`GOOGLE_CLIENT_SECRET`と`TOKEN_KEY`（暗号学的乱数32バイトを64文字の小文字hexにした値）を登録する。秘密値はチャット・ソース・ログ・公開設定ファイルへ貼らない。鍵を変更すると保存済み認可情報を読めなくなるため、解除/再連携が必要。
7. 独立Workerへ公開する場合も、SQLite migrationの`new_sqlite_classes`を使用し、Paidへの変更やKV-backed Durable Objectsを使わない。Workers/Googleの上限エラーで有料化しない。
8. 承認後に機能フラグを有効化し、`firebase-config.js`の`TC_BOOKING_API_URL`へ公開originを設定する。既定は空欄であり、現時点ではネットワーク呼出しも新リンクボタンも無効。
9. 設定→日程確定の自動案内からGoogle追加連携。Googleの同意画面は本人が内容を確認して完了する。Gmail送信元表示を確認する。
10. 本人のテスト用メールだけでオンライン/対面を検証し、アプリを閉じてもMeetと案内が届くことを確認する。終了後、実データを消す操作は本人に確認する。

まだ上記のクラウド設定・追加同意・実送信は実施していない。ローカルテスト成功を本番送信成功と扱わない。

## 使う場所

- 設定→日程確定の自動案内: 本文、送信元、追加連携、連携解除、結果更新・確認付き再試行。
- スケジュール調整: 従来のリンクはそのまま。「自動案内リンク」は新サーバー設定時だけ表示する。対面の会場が空欄なら回答者にはオンラインだけを提示する。
- 本文の`{{詳細}}`へ日時・会議・備考・カレンダー追加URLを差し込む。削除されても詳細は末尾へ必ず付ける。編集は今後作るリンクに適用し、発行済みの文面は変えない。
- 回答控えはsessionStorage。タブを閉じる等で控えを失った場合は主催者へ問い合わせる。公開URLだけでは回答・会議リンクを取得できない。
- アプリは表示中、1分間隔で確定結果を取り込む。手書きメモは上書きせず、取り込み済みの予定を削除しても復活させない。設定から結果更新も可能。
- ローカルの新しい予定と重なる候補はアプリ起動中の同期で取り下げる。サーバー確定時にもGoogle主カレンダーの重複を確認する。オフライン端末だけにある後日の変更をサーバーが知ることはできない。
- 確定済みリンクの取消は提供しない。確定後の予定変更/取消や相手への再案内は通常のカレンダーとメールで行う。

## テスト

```sh
node --test apps/task-calendar/booking-worker/worker.test.mjs
node --test apps/task-calendar/booking-worker/runtime.test.cjs
node apps/task-calendar/tests/v108.cjs
```

`runtime.test.cjs`は既存reminder-workerのインストール済みMiniflareを再利用する（開発用のみ）。v4形式の変換APIを持つMiniflareを使用。ブラウザテストは既存と同じPlaywrightと隔離プロファイル、外部通信モックを使用。Workersのテストも外向き通信をモックし、ローカルSQLiteで確認する。

## 停止・戻し方

`TC_BOOKING_API_URL`を空欄にすると新リンク作成/端末の取込を停止する。既存の回答用URLも使えなくなるが、それだけではサーバーの処理待ちを止めない。**サーバーも止める場合は`ENABLED=false`にする**。連携解除はサーバー保存の更新トークンを消すが、既存Googleカレンダー連携を壊さないようGoogle側の全認可取消はしない。必要なら本人がGoogleアカウントから認可を取り消す。

Firebase/既存meetリンクのルール変更やデータ移行は不要。
