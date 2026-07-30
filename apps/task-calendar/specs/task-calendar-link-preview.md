# リンクのプレビュー（YouTube）

- 対象アプリ: Task Calendar（TaskARE）
- 状態: 実装済み（v91）

## 1. 目的

予定・タスクに貼ったリンク（`link`）は、これまで「リンクを開く」というボタンだけだった。押す前に**何の動画か分からない**ので、YouTubeのリンクは**サムネイル＋動画タイトル＋チャンネル名**で見せる。

## 2. なぜ YouTube oEmbed か

- `https://www.youtube.com/oembed?url=…&format=json` は **APIキー不要・無料・登録不要**
- **CORSが許可されている**ので、中継サーバー（Cloudflare Worker）を立てずにブラウザから直接呼べる
- 一般のWebサイトのOGP取得はCORSの都合で中継が要るため、まずはYouTubeだけ対応する

## 3. 動画IDの取り出し（`ytIdOf`）

| 形 | 例 |
|---|---|
| `youtube.com/watch?v=` | クエリが他にあってもOK（`&t=30s` など） |
| `youtu.be/<id>` | `?t=42` などが付いてもOK |
| `youtube.com/shorts/<id>` | |
| `youtube.com/embed/<id>` `/live/<id>` `/v/<id>` | |
| `m.youtube.com` `music.youtube.com` | 同上 |

上記以外（Zoom・普通のURL・URLでない文字列）は `null` を返し、**従来どおりのボタン**を出す。

## 4. 壊れない作り

| 部品 | 取得方法 | 失敗したら |
|---|---|---|
| サムネイル | `https://i.ytimg.com/vi/<id>/mqdefault.jpg`（**IDから組み立てるだけ**・通信の成否に依存しない） | `error` で `<img>` を外し、枠だけ残す |
| タイトル・チャンネル名 | oEmbed（非同期） | 「YouTube を開く」「youtube.com」のまま |

つまり **oEmbedが失敗してもカードは出るし、リンクは必ず開ける**。オフライン時（`navigator.onLine === false`）は最初から呼びにいかない。

## 5. キャッシュ

- 取得結果は `db.ytCache[動画ID] = { title, author }` に保存し、`persistLocal()` で端末に残す（**クラウド同期の対象外**＝`SYNC_KEYS_*` に入れない）
- 同じ画面での再取得を防ぐメモリキャッシュ（`ytMem`）も持つ。**取れなかったURLも `null` で覚える**ので、何度も叩かない
- 上限300件。超えたら古いものから捨てる

## 6. 出る場所

- 予定・タスクの詳細シート
- 思い出カレンダーのカード

タイマー（フォーカス）画面は場所が狭いので、これまでどおり小さな「リンク」ボタンのまま。
