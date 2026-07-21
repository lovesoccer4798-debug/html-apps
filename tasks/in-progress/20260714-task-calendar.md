# タスク: Task Calendar v1（日／週／月ビュー＋チェックボックス＋タイマーのタスクカレンダー）を作る

- **作成日**: 2026-07-14
- **関連仕様**: `apps/task-calendar/specs/task-calendar-v1.md`
- **優先度**: 高

## ゴール

- [x] 仕様書の「完成の定義」をすべて満たす（詳細はそちらを正とする）
- [x] `apps/task-calendar/` にアプリ一式（index.html / style.css / tokens.css / app.js / README / CHANGELOG / specs）が揃っている
- [ ] mainへのマージ（PR経由・オーナー確認）

## やることリスト

- [x] 仕様書を書く（`templates/spec.md` から）
- [x] Lucideアイコンを取得してインラインSVG化（CDN不使用）
- [x] tokens.css を雛形からコピーし、アプリ固有トークン（エメラルド `#00C896`）を追加
- [x] 3ビュー（日／週／月）＋日付ナビ＋タスクCRUD＋タイマーを実装
- [x] ブラウザで主要フローを手動確認（testing-policy準拠）
- [x] PWA化（manifest・アイコン・Service Worker。オフライン起動をブラウザで確認済み）
- [x] STATUS.md 更新
- [x] PR作成
- [ ] Portal（玄関）への掲載 → **別タスク・オーナー判断待ち**（Dashboardのリンク上限ガバナンスに関わるため）

## 作業ログ

### 2026-07-19（v1.28.0 = スケジュール調整第1弾・サイドバー・ヘルプ）

- スケジュール調整: ui.schedMode/schedSlots(max3)/schedDur(30/60/90)。renderGridに操作バー（sched-bar）＋colクリックでschedAddSlot（30分スナップ・itemsForとの重なりは拒否）・tg-schedブロック表示（タップで解除）。schedText()でSCHED_TPL_DEFAULT（settings.schedTemplateで編集可・{{候補}}置換）→schedCopy()（clipboard＋execCommandフォールバック）。ビュー離脱で自動解除
- サイドバー: `#menu-open`（三本線・appbar-left）→ side-scrim/sidebar（スケジュール調整・使い方・バックアップDL・設定）。CSSはtranslateXドロワー
- ヘルプ: `#help-scrim` に主要機能の説明8項目
- 設定: 「スケジュール調整の定型文」textarea＋リセット
- 第2弾（次回・無料でFirebase実装可）: リンク発行→相手が選択→削除/重複と同期→Meet自動発行。Firestoreに候補docs＋予約画面＋ルール更新が必要な大工事のため分割
- 新機能18＋回帰44＋既存smoke 全PASS。アセットv43。スクショ確認（サイドバー・schedバー）

### 2026-07-19（v1.27.0 = Google常時連携（Worker中継・自動更新））

- notion-worker.jsを統合Worker化: `/gcal/exchange`（code→token交換）/`/gcal/refresh`（refresh→access更新）ルート追加。env GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET（Workerはトークンを保存しない・中継のみ）。既存Notionルートは互換
- app: gcalWorkerCfg()=Notion設定のurl/secretを流用（アプリ側の追加設定ゼロ）。gcalConnect()はWorkerありでcodeフロー（access_type=offline&prompt=consent）、なしで従来implicit。`?code=`ハンドラで交換→{token,exp,refresh}保存。gcalRefreshIfNeeded()（多重呼び出しは1本化）をgcalEnsureMonth/gcalWrite/401リトライにフック。gcalCanWriteはrefresh保有でもtrue
- 設定カード: 「常時連携中（自動更新）」表示＋未移行時は「常時連携に切り替える（再連携1回）」ボタン＋手順hint
- オーナー操作: ①Workerコード貼り替え ②GOOGLE_CLIENT_ID/SECRET登録（console.cloud.google.com/apis/credentials）③アプリで再連携1回
- 新機能9（モックWorkerでcode交換・自動refresh・API再試行）＋回帰44＋Notion10 全PASS。アセットv42

### 2026-07-19（v1.26.0 = 3色追加・予定の色反転・バックアップ）

- ACCENTSにred/yellow/indigo追加（全9色・全ピッカーはACCENTS駆動なので自動反映）
- 予定の色反転: `settings.invertEvents`。renderMonthのchipでkind===eventなら`transparent bg＋borderColor＋color`＋`.mo-chip-invert`。設定にトグル
- バックアップ: `#backup-export`（Blob→aタグDL・taskCalendarBackup:2形式）/`#backup-import`（file input→JSON.parse→db入替→save＋apply*群）。復元前に自動で現在分をDL（安全弁）。`db`をconst→letに変更（復元で入替のため）
- 回答: Googleログイン＆同期ON時はFirebaseに自動バックアップ済み。手動バックアップは容量消費なし（ON/OFF不要）。②常時連携（Worker中継）は次の集中ターン
- 新機能11＋回帰44＋既存smoke 全PASS。アセットv41

### 2026-07-18（v1.25.0 = 平日/土日祝の繰り返し・D 過去を残す削除）

- 平日/土日祝: occursOnに`weekday`（月〜金かつ!isJpHoliday）/`weekend`（土日 or isJpHoliday）分岐。REPEAT_LABELに追加。f-repeat・routineItemRowの選択肢に追加。祝日は既存isJpHolidayで自動反映
- D（過去を残す）: occursOnに`repeatEnd`カットオフ（key>repeatEndで非表示、過去は残る）。deleteRoutine(r,mode) mode='keepPast'（各itemをrepeatEnd=昨日＋routineId外す・単発の今日以降は削除）/'all'（全削除）。undoスナップショット対応。#rdel-scrimの2ボタンを「今日以降だけやめる」「ぜんぶ消す」に。編集で行削除もhandleRemovedでcap（過去あり=残す/過去なし=削除）。一時停止は従来通り
- 新機能16＋回帰44＋既存smoke 全PASS。アセットv40。スクショ確認（削除ダイアログ）

### 2026-07-18（v1.24.0 = ルーティン予定型・曜日選択・月のルーティンチップ）

- C: routine.type（task/event）。routineArr/routineItems追加。passFilter/itemColor/showInMonthを`routineId`だけで判定（event対応）。routine sheetに`#r-type-seg`（setRType）＋submitで種類ごとにdb.tasks/db.eventsへ生成。renderRoutinesはeventで週ドット省略＋`.r-type-chip`、item一覧はroutineItems・repeatLabelOf
- 曜日: occursOnに`weekdays`分岐。routineItemRowに曜日チップ（月始まり）・rep='曜日で'で表示。submitでweekdays保存（未選択はdaily）。repeatLabelOfで「月火水木金」表示
- E: `db.settings.monthHideRoutines`＋showInMonthで判定。renderMonthのmo-style-segに`.mo-rt-chip`（月だけ即時トグル・一覧は不変）
- deleteRoutine/undoをtask/event両対応に。新機能12＋回帰44＋既存smds PASS。アセットv39
- ※D（削除/停止/変更で当日以前を残す＋「過去を消す？」選択）は次の集中実装。データ削除に関わるので慎重に。既存の削除ダイアログ(#rdel keep/all)が土台

### 2026-07-18（v1.23.0 = 「月」カレンダー表示ON/OFF（個別・ルーティン））

- showInMonth(it): it.ref.hideMonth または（routine task の場合）routine.hideMonth で月グリッドから除外。renderMonthのitemsに`.filter(showInMonth)`
- 個別: シートに`#opt-month`（opt-row・common）。openSheet/submit/applyEditでhideMonth読み書き（click handlerも追加）
- ルーティン: routine sheetに`#opt-r-month`。openRoutineSheet/submitでr.hideMonth。フィルタチップ挙動は不変（全ビュー隠し）と併存
- 一覧・日/週/時間/年には残る（passFilterのみ、showInMonthは月だけ）。新機能8＋回帰44＋既存smoke PASS。アセットv38
- 未実装（次）: C=ルーティンを「予定」型に / D=削除/停止/変更時に当日より前の過去データを残す＋「過去を残す？」選択。routineはtype追加＋event生成、DはrepeatEnd等でcutoff＋confirm

### 2026-07-18（v1.22.0 = お昼寝・合計睡眠・対象外月を薄く・タイマー実績反映）

- お昼寝: sleepカードにnap（分・step5）入力。rec.nap保存。sleepTotalMin=夜(bed/wake)＋nap。dur表示は合計＋内訳（夜X＋昼寝Y）。振り返りの平均睡眠・記録一覧もsleepTotalMinに
- 対象外月を薄く: `.mo-cell.is-other .mo-chip/.mdot/.mo-chip-more{opacity:.35}`
- タイマー実績反映: autoFillTimerTime刷新。db.runningにstartedAt追加。end=round5(now)、start=round5(startedAt)、dur=end-start。既存時刻も上書き（ガード削除）、超過ぶんも反映。minutesも日別(minutesDates)に。minutesOn追加しitemsForで使用、applyEditもminutes日別化
- 新機能10＋回帰44＋既存smoke 全PASS。アセットv37
- ※Git: PR #41は seamless(d114a05)前の a07745b でマージ。seamless(v36)＋今回(v37)は未mainのため新PRにまとめる

### 2026-07-18（v1.21.1 = 連日帯を隙間なく・月の余白詰め・日付入力の左寄せ）

- 月の帯を隙間なく: schedule cellを`overflow:visible`＋`padding-x:0`、grid gapを予定表2px/通常4pxに縮小。span chipはJSでinline幅・マージン制御（週端は伸ばさず角丸、中間は左右2px伸ばして接続）。is-span-*クラスは廃止しインラインstyleに
- 日付入力の左寄せ: `input[type=date]::-webkit-date-and-time-value{text-align:left}`（iOSで中央寄せ→右が空いて見えた件）
- 横スクロール発生なし（週端で伸ばさない処理）を確認。回帰44＋v36:13 全PASS。アセットv36

### 2026-07-18（v1.21.0 = 日をまたぐ予定・TimeTree風の連日帯）

- 予定に`endDate`（複数日・繰り返しなし）。eventCoversDay/eventSpan追加。itemsForで開始〜終了の各日に展開しspan情報付与（中日は時刻を出さず、複数日は終日予定のように上へソート）
- シート`#f-date-end`（event-only）。openSheet/submit/applyEditでendDate読み書き（開始日以前・繰り返し時は無効化）
- 日ビュー: tl-timeに「◯日目/全◯日」、カードに期間チップ（item-span）
- 月ビュー（予定表）: mo-chip-spanでis-span-start/mid/endの角丸制御し帯を連結風に。開始日と各週の月曜だけ名前表示、中日は帯のみ
- 新機能13＋回帰44＋既存smoke 全PASS。アセットv35。スクショ確認（旅行19-23/帰省13-15が連日帯・日ビュー3日目/5日）

### 2026-07-18（v1.20.0 = 記念日アイコン選択・上部固定ON/OFF・パッケージUI整え）

- 記念日アイコン: ICONSにheart/cake/party追加（線アイコン）。`a.icon`（既定sparkles）。シートに`#a-icon-seg`（4択・setAnnivIconSel/getAnnivIconSel）。mo-star/日バナー/一覧`.anniv-ic`で選択アイコン反映。ANNIV_ICONS/annivIconName/annivOnDay追加
- 上部固定ON/OFF: `db.settings.stickyHeader`（既定true）。applyStickyHeader()で`data-sticky`属性、CSSで`[data-sticky=off] #scr-cal .appbar/.cal-chips`をstatic化。設定「画面」に`#sticky-toggle`
- パッケージUI: 取り込み部を`.pkg-make-sub`（border-top区切り・pkg-sub-label）に整理。ラベルink2・日付left寄せ。ダークで乱れていた見た目を改善
- ③Dynamic Islandは不可（PWAはActivityKit非対応）と回答。④日跨ぎ予定は次の集中実装へ
- 新機能11＋回帰44＋既存smoke 全PASS。アセットv34

### 2026-07-18（v1.19.1 = 上部固定の修正・パッケージ編集）

- 上部固定バグ修正: `position:sticky` は親のボックス内でしか効かず、短い`.appbar`の子（`.cal-stick`）をstickyにしていたため約50pxで固定解除→「すべて・マイカレンダー」で固定でなくなっていた。親が画面全体の`#scr-cal .appbar`自体をstickyにして常時固定に。フィルタチップ`.cal-chips`も`top:var(--cal-stick-h)`（appbar高さをupdateCalStickHで計測）で真下に固定
- パッケージ編集: renderPackages刷新。各項目を種類トグル（タスク/予定）・開始/終了時刻input・名前inputで編集可、「＋項目を追加」「＋空で新規作成」。適用時は空タイトル項目を除外
- 新機能9（v34）＋回帰44＋既存smoke 全PASS。アセットv33

### 2026-07-18（v1.19.0 = パッケージ・タスク一覧）

- パッケージ: `db.packages`（SYNC_KEYS_ARRに追加）。ルーティン画面のrvSegに3つ目のタブ追加。renderPackages/pkgItemsFromDay（itemsForから日付非依存のひな型化）/applyPackage（tasks/eventsへ複製→入れた日へジャンプ）。作成は「取り込む日付」→その日のitemsForを取込、適用は各カードの日付inputで別日へ。項目の個別削除・パッケージ削除（undo）
- タスク一覧: 新画面`scr-tasklist`＋ボトムナビ6項目化（data-nav="tasks"）。renderTaskList（db.tasksを日付順、未完了/すべて切替、単発はt.doneチェック・繰り返しは代表表示、タップで該当日へ）。setScreen/renderAll/bottomnav activeに配線。bottomnavアイコンpaddingを細めに調整して6項目対応
- 新機能11＋回帰44＋既存smoke全PASS。アセットv32

### 2026-07-18（v1.18.0 = テーマ切替・上部固定・時間軸あいだ・まとめ日記・月の縁色）

- ヘッダーにテーマ切替（#theme-toggle・sun/moon/sunMoonアイコン・THEME_CYCLE auto→light→dark）。applyTheme()がupdateThemeToggle()を呼び、設定#theme-segとsyncThemeSegで双方向同期
- カレンダー上部を`.cal-stick`でsticky（appbar-top/date-row/segを包む。goal-lineは外に置きスクロール）。`#scr-cal .appbar`のpadding-topを0にして二重を回避
- 「日」の時間軸: renderDayで直前予定の終了(prevEnd)から次の開始までの空きを`.tl-gaprow`/`.tl-gap`で表示。spineは`.tl-rail::before`をsolidに
- まとめ日記「あのね。ノート」: buildDayLogCard→`db.dayLogs[key]`（SYNC_KEYS_OBJに追加・後方互換）。notionDayPayloadの日記先頭にも【あのね。ノート】で合流
- 月の縁色: itemEdgeColor(it)＝colorRules（title/whoに一致）優先→なければmonthEdge ONで黒っぽい縁。chipはinset box-shadow、dotはリング。設定に`#month-edge-toggle`＋色ルールを「人・意味で分ける（自分の画面だけ）」に説明更新。colorRulesはユーザー個人同期のみで共有相手に非影響
- notion-worker.js: NOTION_TOKEN/TC_SHARED_SECRETを.trim()（貼付けの空白・改行対策で401を起きにくく）
- 新機能9＋5分/睡眠8＋回帰44＋Notion10＋トグル3 PASS。アセットv31

### 2026-07-18（v1.16.0 = Notion連携）

- Notion連携: 日々の記録（日記＝タスク/予定の日記＋ひとことメモ、できたこと数、就寝/起床）を自分のNotion DBへ1日1ページで転記。同じ日付は上書き（upsert：日付一致でPATCH、なければPOST create）
- 中継は Cloudflare Worker（`notion-worker.js`）。Notion API はCORS非対応でブラウザ直呼び不可＋トークン秘匿が必要 → Worker が token を環境変数に保持して中継。アプリはWorker URL・合言葉・DB IDだけ持つ
- 合言葉（`X-TC-Secret` ↔ env `TC_SHARED_SECRET`）でWorker URLが漏れても勝手に書き込まれない。保存後8秒デバウンスで自動送信（無料枠にやさしく・今日の分のみ）＋手動送信ボタン
- 設定 → Notion連携（`#notion-body`）: URL・合言葉[password]・DB ID・自動送信ON/OFF。app.jsのNotionモジュール（notionCfg/notionReady/notionDayPayload/notionPush/scheduleNotionPush/renderNotionCard）。save()にscheduleNotionPush()をフック。settings.notion={url,secret,dbId,on}（追加のみ・後方互換）
- 新規10（Notion）＋回帰44 PASS。オーナー側の準備: Workerデプロイ＋環境変数、Notionでintegration作成・DB接続・プロパティ用意（名前/日付/日記/メモ/できたこと/就寝/起床）

### 2026-07-18（v1.15.0 = 日別時刻・タイマー自動反映・5分刻み・ユーザー名）

- 時刻を日別独立化: timeOn/timeEndOn（timeDates/timeEndDates優先＞master）をitemsForに反映。applyEditは繰り返し時setPerDayFieldで日別保存。表示はit.timeEnd（occurrence）へ統一。ルーティン定義の時刻=master（全日既定）、各日編集=独立
- タイマー完了で時刻自動記録: autoFillTimerTime（完了時刻5分切り上げ=終了、−totalMs=開始）をtoggleItem/completeRunningにフック。既存時刻があれば触らない
- 5分刻み: 時刻inputにstep=300、所要時間/ルーティン分にstep=5・min=5
- ユーザー名（settings.userName）＋差出人名フォールバック（senderName||userName）
- 新規13＋回帰44 PASS

### 2026-07-18（v1.14.0 = gcal重複バグ修正・スタイル変更・招待差出人/追記）

- **重複バグ修正**: gcalFetch={}後に古いgcalEventsが残り再取得でpush重複 → 月の既存を再取得前にクリア
- スタイル変更（round/square/crisp）: tokens.cssで角丸/影/線トークンを一括override＋applyStyle。既定round
- 招待: settings.senderName＋予定のinviteNote→Google eventのdescriptionに反映（件名/送信元はAPI変更不可を明記）。削除の双方向はv1.12で実装済（gcalId→DELETE）
- **次回に集中実装（大きめ）: ①タイマー完了で開始/終了時刻を自動反映（5分丸め・逆算）②タスク/ルーティンの時刻を日別独立（timeDates/timeEndDates）**。新規10＋回帰44 PASS

### 2026-07-18（v1.13.0 = 招待メール・共有コピー・トグル不具合修正）

- **不具合修正**: 予定シートの「Googleにも登録/Meet自動発行」がiOSのシート内でネイティブcheckboxが反応しづらく無反応に見えた → 自前トグル（.opt-row/.opt-toggle・click切替）に置換。ヘッドレスでは元々toggleできていたのでiOS固有と判断
- 招待メール（attendees＋sendUpdates=all）でGoogleが招待送信。詳細に「共有用にコピー」（日時/リンク/ID/パスコード・Meet/Zoomコード抽出）。混乱回避で外部「＋Meet作成」ボタン廃止（自動発行に一本化）
- 新規11＋回帰44 PASS。**オーナー: calendar.eventsスコープ追加＋再連携が前提（PR #35と同じ）**

### 2026-07-18（v1.12.0 = Googleカレンダー双方向＋Meet自動発行）

- スコープをcalendar.eventsへ。予定シートに「Googleにも登録」「Meet自動発行」（連携中のみ）。作成POST(conferenceDataVersion=1)→gcalId/hangoutLink保存、編集PATCH、削除DELETE、Undoで再作成。単発のみ・重複は表示側で統合。401/403で再連携促し
- **オーナー操作: OAuth同意画面にcalendar.eventsスコープ追加＋設定から「再連携」で書き込み許可**（spec§5）。モックでPOST/PATCH/DELETE/Meet検証・新規9＋回帰44 PASS。次: ②Notion

### 2026-07-18（v1.11.0 = ズーム固定・タイマー終了通知）

- ズーム固定: viewportにid付与＋applyZoomLockで maximum-scale=1,user-scalable=no を出し入れ。設定「画面」で固定/自由（既定=固定）。iOSの入力フォーカス時オートズームも抑制
- タイマー終了通知: finishTimer→notifyTimerDone（navigator.vibrate＋許可時 SW showNotification/Notification）。設定でON時に許可要求。**iOS制約: Vibration API非対応・音はサイレントSW依存 → 通知バナー＋PWA追加を案内**（正直に明記）
- 次: ① Google双方向＋Meet自動発行（別ターン・write scope追加要）→ ② Notion。新規9＋回帰44 PASS

### 2026-07-17（v1.10.0 = 会議リンク・日ビュー終了時刻／Notion構想）

- Q回答: gcal同期は読み込みのみ・片方向（アプリ→Googleは書かない）
- 予定に会議リンク（meetUrl）＋詳細に「会議に参加」ボタン。Meet/Zoom新規作成ショートカット（URL自動発行はwrite scope/サーバー必須のため貼り付け方式）。gcalのhangoutLinkも参加ボタン対応
- 日ビュータイムラインに終了時刻を表示（tl-start/tl-end）
- Notion連携は spec/task-calendar-notion.md に構想記載（Cloudflare Worker中継が必要＝次段階）。新規7＋回帰44 PASS

### 2026-07-17（v1.9.0 = Googleカレンダーのフィルタチップ）

- オーナー: Google連携成功。要望でチップフィルタに「Googleカレンダー」を追加（passFilterでgcalをfへ・allFilterIds/チップ条件にgcalConnected()）。チェックで表示/非表示。新規5＋回帰44 PASS

### 2026-07-17（v1.8.0 = 終了時刻・睡眠一覧・ルーティン期間・gcal URI表示）

- タスク・予定とも終了時刻（timeEnd）: シート時刻欄を開始/終了の2つに・event-only解除・grid durMin/カード/詳細を全kind対応
- 睡眠の全記録一覧を振り返りに追加（平均に加え日別bed/wake/dur）
- ルーティンにperiodStart/periodEnd（occursOnで期間ゲート・カード表示・終了は取消線）
- gcalの redirect_uri_mismatch対策: 実リダイレクトURIを設定に表示＋コピー（**オーナー操作: Cloud Consoleの承認済みリダイレクトURIにこれを完全一致で登録**）
- 新規8＋回帰44 PASS

### 2026-07-17（v1.7.0 = スワイプ崩れ修正・星アイコン化・睡眠モード）

- **重要修正**: 横スワイプのゴースト方式（left:±100%）が横方向にはみ出し、月グリッド・ボトムナビ崩れ＋UIの右ずれを引き起こしていた → ゴースト廃止・本体のみ追従＋離したらフェードで差し替え・body に overflow-x:hidden。回帰44 PASS
- 記念日の星を絵文字✨→Lucide sparkles（金色SVG）に。AI感の払拭
- 睡眠モード設定（evening/morning）で日ビューの就寝・起床の並び順を選択（sleepDurMinは両モードで正しい）。週月平均は既存の振り返りに表示済み

### 2026-07-17（v1.6.0 = 詳細ビュー・予定の繰り返し・日記・記念日改善・表示ON/OFF）

- クライアントID訂正（...2cot9cb3...）／タップ→詳細ビュー（ペンで編集・gcalは読取専用）／予定にも繰り返し（itemsForをoccursOnへ・deleteItem/del-allを配列共通化）／メモの下に日記（memo/diaryを日別perDay共通ヘルパ化）／記念日を毎年毎月単発＋月カレンダー星＋編集削除整理／設定「表示する項目」でビュー・タブのON/OFF。新規22＋回帰44 PASS（回帰はタップ=詳細に合わせ1件更新）

### 2026-07-17（v1.5.0 = 記念日・色ルール・期間メモ＋スワイプ改善）

- オーナー提供のOAuthクライアントID（797466638176-19rigs...）をfirebase-config.jsに設定 → Google連携がすぐ使える状態に
- 修正: 横スワイプを前後ページのゴースト方式にしてシームレス化（濃色の隙間解消）・時間割入場時は最上部へスクロール
- ②着手: 記念日タブ（あと◯日・◯周年・当日バナー）／色ルール定義（未作成時は例表示）／週月年のふりかえりメモ（見返しリストつき）。新規14＋回帰44 PASS
- 申し送り（未）: ホーム表示ON/OFF・説明書/FAQ・Notion連携（Workers中継）・Google書き込み双方向。TimeTreeはAPI終了で不可

### 2026-07-17（v1.4.0 = Googleカレンダー連携第1弾ほか）

- **重要**: PR #27はv1.0.0時点でマージ済みだったため、v1.1〜v1.3はPRなしでブランチに滞留していた → mainへrebaseして新PRを作成（Pagesはブランチ配信らしくオーナーには見えていた）
- Googleカレンダー連携（読み込み・spec: task-calendar-gcal.md）: リダイレクト式OAuth（CDN不使用）・readonlyスコープ・月単位取得・重複統合・読み取り専用表示。**残り（オーナー操作）: Google Cloud ConsoleでOAuthクライアント作成→TC_GCAL_CLIENT_IDに貼る（spec§4）**
- 同期エラーにコード表示（オーナー報告の「同期できない」の切り分け用。permission-deniedならFirestoreルール貼り付けで解決の見込み）・つながる横スワイプ・時間枠ボタンの余白。新規11＋回帰44 PASS

### 2026-07-17（v1.3.0 = 使用感の改善5点）

- ①時間割の日付送りでスクロール位置を維持（自動スクロールは入場時のみ）②時間枠ボタンを左下へ＋枠本体ドラッグで移動 ③本体横スワイプで日付送り（全ビュー）④「新規登録」の auth/operation-not-allowed は**コンソールでメール/パスワードのプロバイダ未有効が原因**（オーナー操作: Authentication→Sign-in method→メール/パスワードを有効化。コード修正は不要）⑤誰と自由入力に過去の名前の補完候補。新規8項目＋回帰44 PASS

### 2026-07-17（v1.2.0 = メール認証・誰と/場所・時間枠ドラッグ）

- ログイン失敗はエラーコードで auth/unauthorized-domain と確定（**オーナー操作: Firebaseコンソール→Authentication→Settings→承認済みドメインに lovesoccer4798-debug.github.io を追加**）。加えてオーナー要望のメール＋パスワードの新規登録/ログイン画面を実装（**要: コンソールでメール/パスワードのプロバイダ有効化**。承認済みドメイン設定なしでも動く）＋同期ON/OFF切替
- 予定に誰と（設定「よく会う人」からワンタップ＋自由入力）・場所・終了時刻。検索は名前・場所でもヒット、ジャンプ先は現在ビュー維持。時間割ビューはタップ→時間枠→つまみドラッグ（15分刻み）→「予定を追加」
- 新規20項目＋回帰44 PASS

### 2026-07-17（v1.1.0 = 時間割ビュー・検索・不具合2件修正）

- オーナー報告①ログイン失敗 → PWA(standalone)ではsignInWithPopupが開けないためリダイレクト方式へ自動切替＋getRedirectResult回収＋エラーコード表示（**オーナー操作: Firebaseコンソールで Google プロバイダ有効化＋承認済みドメインに lovesoccer4798-debug.github.io を追加**。アカウントはログイン時に自動作成されるのでアプリ側の新規登録は不要）②土日祝色が出ない → --tc-sat/--tc-sun の変数定義漏れを発見・追加（CSS側の参照は前からあった）
- 新機能: 時間割ビュー（「時間」タブ・1日/3日/週・既存の日週ビューは不変更）と検索（虫めがね→キーワード→年月日・曜日つき候補→デイリーへジャンプ）。新規15項目＋回帰44 PASS
- **申し送り（オーナー要望・将来対応）: 設定画面で機能ごとの表示ON/OFFを選べる仕様**（機能が増えてきたときの使いやすさ対策）。追加要望はまだある由

### 2026-07-16（v1.0.0 = Firebase Phase B・カレンダー共有）

- 招待コード式の共有カレンダーを実装（`shared/{コード}` 1ドキュメント方式・onSnapshotリアルタイム受信・3秒デバウンス送信・差分なしは書かない）。権限=編集可/閲覧専用/解除をオーナーが設定、UIとFirestoreルールの両方で強制。回帰44 PASS。**残り（オーナー操作）: Firestoreルールを仕様書§3の最終版に置き換え→スマホ2台で共有テスト**。既知の制約: 解除後も同じコードで再参加できる（完全に見せたくない場合は削除して作り直し）

### 2026-07-16（v0.9.0 = Firebase Phase A）

- オーナーのFirebaseプロジェクト（task-calendar-2312e）でGoogleログイン＋クラウド同期を実装。SDKはvendor同梱・遅延読込（ADR）。同期はドキュメント単位の後勝ち＋2.5秒デバウンス押し上げ。gitleaks誤検知対策で.gitleaks.toml追加。**残り（オーナー操作）: Auth許可ドメインにgithub.ioを追加＋Firestoreルール貼り付け→実機でログイン確認。Phase B=カレンダー共有は次**


### 2026-07-15（v0.8.0 = ビジョンボード）

- 確定仕様どおり実装（テンプレ4種＋自由配置・キャプション/ボードメモ・IndexedDB画像・1年前の今日）。新規20項目＋回帰（v2:44・マイカレンダー）PASS。Firebase共有はオーナーのFirebaseプロジェクト準備待ち


### 2026-07-15（v0.7.1＋仕様確定）

- 日付見出しを20pxに統一。土日祝色はv0.6.0（PR#24・未マージ）に実装済みを確認。SW空ファイル不具合を修正。ビジョンボード（テンプレ/自由配置2モード＋写真下メモ・今日ランダム表示なし）とFirebase共有（Googleのみ・A→B・権限は編集/閲覧専用/非表示をオーナー選択）の仕様を確定


### 2026-07-15（v0.7.0 = v6第1段階）

- マイカレンダー（上限8・チップフィルタ・擬似ルーティンチップ・設定で管理）実装。新規11項目＋回帰44 PASS。第2段階=Firebase共有、将来=API連携（Google/Notion・設定からON/OFF）は仕様書に記録済み


### 2026-07-15（v0.6.0）

- 予定表セル均等化・文字サイズ3段階・土日祝の色（祝日はJS内蔵の近似計算・外部API不使用=無料）・睡眠記録＋振り返り平均を実装。新規9項目＋回帰44 PASS。注意: PR #23は予定表/目標のpush前にマージされていたため、それらも含めて新PRへ。カレンダー分け/共有/ログイン（Firebase）はv6以降の提案として保留


### 2026-07-15（v0.5.1）

- 期間ごとの目標（日/週/月/年・タップで編集）を追加。ルーティンタブが効かない報告はデプロイ直後のキャッシュ版ズレが原因とみて、資材URLに?v=を付与（今後はズレない）。全回帰PASS


### 2026-07-15（v5系の小改善）

- 何をしたか: オーナー要望3点 — ①TimeTree風「予定表」モード（月ビュー内トグル・既存ドット表示は不変更・タスク/予定ごとの色選択つき）②週見出しの変な改行を修正 ③各シートに×ボタン（追加せず戻れる）。新規15項目＋全回帰PASS
- 次にやること: PR #23マージ後、v5=ビジョンボードの仕様書へ


### 2026-07-15（v4実装）

- 何をしたか: 確定済みv4仕様どおり**ルーティンパッケージ**を実装（4タブ目・ゆる達成・週3日既定・JSON共有・一時停止・12週履歴・振り返り連携）。アイテムは既存の繰り返しタスクに `routineId` を足す方式で、チェック／スワイプ／メモ／タイマーがそのまま使える。v4新規19項目＋全回帰（v2:44・v3:29）PASS
- 気づき: フォントの件はオーナー側で解決済み（v0.3.1の対策はそのまま残す）
- 次にやること: オーナーがPR #23（フォント対策＋v4）をマージ。v5候補=ビジョンボード（仕様書はまだ・承認待ち）


### 2026-07-15（v3.1＋v4仕様）

- 何をしたか: オーナー報告「フォント選択が切り替わらない」に対応（フォールバック強化・設定画面にプレビュー・端末にない書体へ「＊」表示。根本原因は端末の日本語書体不足で、特にiPhoneは明朝・等幅の日本語書体がない）。**v4仕様書（ルーティンパッケージ）を下書きで作成 — オーナー承認待ち。承認までは実装しない**
- 次にやること: オーナーがv4仕様書 §7 の論点4つ（4タブ化／やった日の判定／週目標の既定値／共有方式）に回答→承認→v4実装


### 2026-07-14

- 何をしたか: オーナーの依頼（日／週／月ビュー・チェックボックス完了・振り返りで自己肯定感・タスク時間のカウントダウンタイマー・ワクワクするUI/絵文字なしのシンプルアイコン）を受けて、仕様書作成→実装→手動確認まで完了。テーマカラーはオーナー指定のエメラルドグリーン `#00C896`
- 気づき・ハマりどころ:
  - タイマーは `setInterval` の減算ではなく終了時刻（タイムスタンプ）方式にした。タブが非アクティブでも実時間で正しく進む
  - `#00C896` の上の文字は白だとコントラスト不足のため、濃いティール（`--tc-accent-ink`）を採用
  - 削除は confirm ではなく「元に戻す」トースト方式（設計原則3「壊しても、戻れるようにする」）
- 次にやること: PRを作ってオーナーがレビュー→mainへマージ→Portal掲載の要否をオーナーが判断
### 2026-07-15（v3）

- 何をしたか: オーナー承認のv3を実装（仕様: `specs/task-calendar-v3.md`）。①年月ピッカー ②年ビュー（ヒートマップ）③振り返りの週／月／年切替 ④タスクメモ（繰り返しは日ごと＝日記）⑤フォント4択。**機能ごとに1コミット**（気に入らない機能だけrevertで戻せる）。データは追加フィールドのみで後方互換。v2回帰44項目＋v3新規29項目PASS
- 重要な気づき: **PR #21はv2 pushの前にマージされていた**（mainはv1+PWAのみ）。未マージのv2コミットはrebaseで新ブランチへ引き継ぎ、v2+v3をまとめて新PRに
- 次にやること: オーナーがv2+v3のPRをレビュー→マージ。v4候補=ルーティンパッケージ、v5候補=ビジョンボード（オーナー承認済みの構想、仕様書はまだ）

### 2026-07-15

- 何をしたか: オーナー支給のデザインhandoff（Turn4=ダーク/Turn5=ライト）に合わせて**v2へ全面刷新**（仕様: `specs/task-calendar-v2.md`）。設定画面（テーマ手動切替＋アクセント6色）・繰り返しタスク（毎日/毎週/毎月/毎年、削除は「この回のみ/すべて」）・「予定」（タスクと別枠）・行の左スワイプで編集/削除・フォーカス全画面タイマー（リロード復元つき）・振り返り画面を実装。Chromiumで44項目の手動確認PASS（ライト/ダーク・オフライン含む）
- 気づき・ハマりどころ:
  - Google Fonts/Material SymbolsはCDN禁止・オフラインPWAと衝突 → 端末標準フォント＋Lucideで再現（ADR: 20260715-task-calendar-v2-design）
  - 繰り返しは「ルール＋doneDates/exDates」方式（インスタンス生成せず表示時に展開）。31日開始の毎月繰り返しは存在しない月に自然と出ない
  - スワイプは縦スクロールと競合するため、横移動が優位のときだけドラッグ開始
- 次にやること: オーナーがPR #21をレビュー→マージ→Pages有効化（未の場合）

### 2026-07-14（追記）

- オーナーの追加要望「無料で使える」「PWA化」を実装。無料=GitHub Pages（静的・サーバー不要）。PWAはmanifest＋Service Worker（ページはネット優先・資材はキャッシュ優先＋裏で更新）。SWのスコープは `apps/task-calendar/` 内のみで他アプリに影響しない。オフラインでの再訪起動をChromiumで確認済み。**残り: オーナーがPRをマージ→リポジトリのPagesが未有効なら Settings→Pages で有効化**
