# 天気と祝日（外部API）

- 対象アプリ: Task Calendar（TaskARE）
- 状態: 実装済み（v92）
- 前提: **無料・APIキー不要・登録不要**。中継サーバー（Cloudflare Worker）も不要（どちらもCORS許可あり）

## 1. 天気（Open-Meteo）

### エンドポイント

```
https://api.open-meteo.com/v1/forecast
  ?latitude=..&longitude=..
  &daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max
  &timezone=Asia%2FTokyo&forecast_days=10&past_days=3
```

APIキー不要。過去3日ぶんも取るので、少し前の日を見返したときにも出る。

### 設定（端末ごと・`db.settings.weather`）

| キー | 中身 |
|---|---|
| `on` | 表示するか（既定 `false`） |
| `place` | 主要16都市のID、または `'here'` |
| `lat` / `lon` / `name` | `place === 'here'` のときの座標（**小数第2位に丸めて保存**＝細かすぎる位置は持たない） |

`settings` はクラウド同期の対象外なので、**位置情報はこの端末から出ない**。取得のため Open-Meteo に緯度経度は渡る。

### キャッシュ（`db.weather`）

`{ place, name, at, daily: { 'YYYY-MM-DD': { c, hi, lo, pop } } }` を localStorage に保存。**3時間以内は取り直さない**。地点を変えたときは即取り直す。取得は起動1.5秒後と、画面が再表示されたとき。

失敗したら前回の内容をそのまま使う（`console.warn` だけ・画面には出さない）。

### 天気コードの対応（WMO）

| コード | 表示 | Notionの「天気」 |
|---|---|---|
| 0 / 1 / 2 | ☀️ 晴れ / 🌤 おおむね晴れ / ⛅️ 晴れときどきくもり | 晴れ |
| 3 / 45,48 | ☁️ くもり / 🌫 きり | くもり |
| 51-57 / 61-67 / 80-82 / 95- | 🌦 霧雨 / 🌧 雨 / 🌦 にわか雨 / ⛈ 雷雨 | 雨 |
| 71-77 / 85,86 | ❄️ 雪 / 🌨 にわか雪 | 雪 |

### 出る場所

- 「日」ビュー先頭の情報バー（`.dayinfo`）: `☀️ 晴れ 32°/24° ☔️20%`（降水確率は20%以上のときだけ）
- 「時間」ビューの日付見出し: 絵文字のみ

## 2. 祝日（holidays-jp）

`https://holidays-jp.github.io/api/v1/date.json` — GitHub Pages の静的JSON。`{"2026-07-20":"海の日", …}` の形で前後1年ぶんほど。**30日に1回**だけ取得する。

### なぜ入れたか

これまでは計算で推定していた（固定祝日・ハッピーマンデー・春分秋分の近似式・振替休日）。普通の年は合うが、**臨時の祝日（五輪の移動など）や法改正には追従できない**。

### 使い方（`db.holidays`）

`{ at, min, max, map }` を保存。`isJpHoliday(d)` は

1. `min`〜`max` の範囲内 → **取得したデータを正**とする（そこに無ければ祝日ではない）
2. 範囲外・未取得 → **従来の計算にフォールバック**

これで「平日」「土日祝」のルーティンの判定も正確になる。祝日名は「日」ビューの情報バーと、「時間」の1日表示の見出しに出す。

## 3. Notion連携への反映

`notionDayPayload` に `weather`（晴れ／くもり／雨／雪のいずれか）を足した。Worker 側は

```js
if (weather != null) props['天気'] = { select: weather ? { name: String(weather) } : null };
```

- **アプリの「天気」設定がONで、その日のデータがあるときだけ**送る
- データが無い日は**フィールドごと送らない**ので、手で選んだ天気が空で上書きされない

Notion側のデータベース（📔 デイリーログ）には「天気」セレクトが既にあったので、新しいプロパティは作らずそれを使う。v90の「タスク」だけは新規に追加した（リッチテキスト）。
