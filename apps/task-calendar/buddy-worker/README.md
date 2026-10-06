# Buddyの無料限定サーバー

独立したWorkers Free + SQLite Durable Object + Workers AI。既存メールWorkerの`/owner/status`へBearerを転送して本人確認するが、レスポンスの個人情報は読まず破棄する。メール側のGoogle追加連携状態には依存せず、Firebase本人認証に依存する。メールWorkerを停止するとBuddyも安全側に停止する。

## 公開前

1. Cloudflare実画面でWorkers Freeを確認。有料化・AI Gatewayクレジット/自動チャージを設定しない。
2. 固定モデルの無料対応と[料金](https://developers.cloudflare.com/workers-ai/platform/pricing/)・[データ利用](https://developers.cloudflare.com/workers-ai/platform/data-usage/)を確認。日本語品質を合成入力のみで確認する。
3. `wrangler.jsonc`は既定無効。本人承認後のみ両フラグtrueで公開し、フロント接続先`TC_BUDDY_API_URL`を反映する。
4. 未認証401・別Origin403・日30回/5秒制限・不正本文拒否を検証。公開結果をSTATUSへ記録。

## 境界

- 固定モデルのみ、`max_tokens:512`。クレジット、外部の有料AI、検索・ツール実行の経路なし。
- Free契約上限では失敗、日30回も永続カウンタで停止。予算通知は安全装置の代わりではない。第三者が有料へ契約変更した場合の課金はコードだけでは防げない。
- サーバーに会話や名前を保存しない。DOにはUTC日付・回数・最終送信時刻のみ。ログ無効。推論はCloudflareで処理される。
- タイムアウトやブラウザの中止でも開始済みAI計算は止まらない場合があるため、回数は消費し自動再試行しない。
- 停止: ENABLED=falseで再公開。既存メール・カレンダー・Firestoreには変更不要。

## 公開記録（2026-10-06）

- 公開先: https://taskare-buddy.love-soccer4798.workers.dev
- Version: `ccc0a51a-251f-4ed8-811f-e5cf999d8f78`。Workers Freeの現行契約を画面確認し、有料化や秘密設定の変更なしで公開。
- 公開先の未認証401・別Origin403を確認。単体5件・SQLiteランタイム1件、隔離ブラウザーのモック会話テスト成功。実AIの日本語回答は本番画面反映後の本人確認が残る。
- 標準3画像は本機能用の生成PNG。画像・設定は端末のみ、通常バックアップには含めない。

設定ファイルの既定値は無効のまま。再公開時も契約を再確認した上で、明示的に両フラグを指定する。フラグなしで再公開すると停止する。

```sh
WRANGLER_SEND_METRICS=false node apps/task-calendar/reminder-worker/node_modules/wrangler/bin/wrangler.js deploy --config apps/task-calendar/buddy-worker/wrangler.jsonc --var ENABLED:true --var FREE_PLAN_CONFIRMED:true
```

停止するときは同じコマンドで`--var ENABLED:false --var FREE_PLAN_CONFIRMED:false`を指定する。本機能のみ停止し、FAQは利用できる。
