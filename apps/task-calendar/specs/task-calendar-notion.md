# Task Calendar — Notion連携 仕様（構想・未実装）

- **ステータス**: 構想。次の段階で実装（この段階では未着手）
- **関連**: オーナー要望「Notionとの連携も進めたい」・日記/振り返りメモを自分データベース化する構想

## 1. なぜ中継（プロキシ）が必要か

Notion API（`api.notion.com`）は**ブラウザから直接呼べない**（CORS非対応・かつ integration token を秘密にする必要がある）。
静的サイト（GitHub Pages）から安全に呼ぶには、**軽量な中継サーバー**が1つ必要。

- 推奨: **Cloudflare Workers**（無料枠・クレジットカード不要・1日10万リクエストまで無料）
- Worker が Notion token を保持し、アプリ→Worker→Notion と中継。アプリ側は Worker のURLだけ知る

## 2. 使い方の案

- **書き出し（アプリ→Notion）**: 日記・振り返りメモ・完了タスクを、指定した Notion データベースへ1日1ページ（または追記）で自動転記。設定でON/OFF・対象データベースIDを指定
- **方向**: まずは片方向（アプリ→Notion）。将来は双方向も検討
- プロパティ例: 日付 / できたこと / 日記 / 就寝・起床 / ルーティン合否

## 3. 実装ステップ（次段階）

1. オーナーが Notion で integration 作成（token取得）＋対象データベースを共有
2. Cloudflare Worker を用意（token を環境変数に。エンドポイント: `POST /notion/upsert` 等）
3. アプリ設定に「Notion連携」セクション（Worker URL・データベースID・ON/OFF）
4. `save()` 後のデバウンスで当日分を upsert（無料枠にやさしく差分のみ）

## 4. 無料の範囲

- Cloudflare Workers 無料枠・Notion API 無料。サーバー常時起動は不要（Workerはリクエスト時のみ）

## 5. やらないこと（当面）

- Notion→アプリの取り込み（双方向）は将来。まずは記録の外部バックアップ／AI活用向けデータ蓄積を優先
