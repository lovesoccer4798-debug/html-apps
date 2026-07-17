# Task Calendar — Googleカレンダー連携 仕様

- **ステータス**: 第1弾（読み込み・表示）実装済み（2026-07-17）。第2弾（書き込み・双方向）は未着手
- **関連**: `specs/task-calendar-firebase-sync.md`（クラウド同期）・オーナー要望「TimeTreeとGoogleカレンダーの統合」

## 1. 背景 / 課題

オーナーはTimeTreeとGoogleカレンダーを併用しており、このアプリと合わせて予定が分散している。
TimeTreeは公式APIが終了（2023年）しているため接続不可。**統合ハブはGoogleカレンダー**に置く方針。

## 2. 方式（無料・CDN禁止と両立）

- OAuthは**リダイレクト方式（インプリシットフロー）**。外部ライブラリ・CDN不使用（`accounts.google.com/o/oauth2/v2/auth` へ遷移し、戻りURLのフラグメントからアクセストークンを回収）
- スコープは `calendar.readonly`（読み込みのみ。書き込み権限は第2弾まで求めない）
- アクセストークン（約1時間有効）は**この端末のlocalStorageのみ**に保存。クラウド（Firestore）へは送らない
- 取得はメインカレンダー（primary）を**月単位でまとめて1リクエスト**（singleEvents=true・最大250件・必要フィールドのみ）。取得済みの月はメモリキャッシュ
- 期限切れ（401/403）は「再連携」ボタンを設定に表示。自動で再認可画面へは飛ばさない（急にページ遷移しない）

## 3. 表示ルール

- Googleの予定は `kind:'gcal'` として日・週・時間・月に**青色・「Google」ラベル**で表示。読み取り専用（チェック・スワイプ編集・削除なし。時間割でタップしても編集シートは開かずトースト）
- **重複統合**: 同じ日・同じ開始時刻・同じタイトルのローカル予定があるとき、Google側は表示しない
- 設定「Googleカレンダー連携」: 連携する／表示ON・OFF／連携を解除
- チップフィルタの対象外（表示ON/OFFは連携設定側で管理）

## 4. オーナーの準備（無料・1回だけ）

1. [Google Cloud Console](https://console.cloud.google.com/) → プロジェクト作成（Firebaseと同じプロジェクト `task-calendar-2312e` を選んでもOK）
2. 「APIとサービス」→「ライブラリ」→ **Google Calendar API を有効化**
3. 「APIとサービス」→「OAuth同意画面」→ 外部・アプリ名等を入力 → **テストユーザーに自分のGmailを追加**（公開審査は不要）
4. 「認証情報」→「認証情報を作成」→ **OAuthクライアントID（ウェブアプリケーション）**
   - 承認済みJavaScript生成元: `https://lovesoccer4798-debug.github.io`
   - 承認済みリダイレクトURI: `https://lovesoccer4798-debug.github.io/html-apps/apps/task-calendar/index.html`
5. 発行された**クライアントID**を `apps/task-calendar/firebase-config.js` の `TC_GCAL_CLIENT_ID` に貼る（公開してよい識別子）

## 5. 第2弾（未実装・構想）

- 書き込み（このアプリの予定→Google。方向ごとのON/OFF）
- externalId（gcalId）でのひも付けによる双方向の重複防止・更新追従
- primary以外のカレンダー選択

## 6. やらないこと

- TimeTree連携（公式APIが存在しない）。共有相手は本アプリの共有カレンダーへ移行を推奨
