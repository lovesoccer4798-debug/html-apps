# 仕様案: 日程確定とGmail案内

- 作成日: 2026-10-01
- ステータス: 要件確認済み・サーバー構成提案（未実装）

## 確認済みの体験

- 相手が候補日時・メールアドレス・対面/オンラインを選ぶ。備考は任意。備考に先方のZoom等のURLも記載できる。
- オンライン時は、備考URLの有無に関係なくGoogle Meetを自動発行。先方URLでMeetを上書きしない。対面時は会場を案内し、Meetは発行しない想定。
- 備考はTaskARE予定のmemoとGoogleカレンダーのdescriptionに同じ内容で保存。相手のURLは「先方からの備考」、Meetは「TaskARE発行のGoogle Meet」と区別する。参加先を勝手に推定しない。
- Google連携中のアカウントのGmailから確定案内を自動送信。アプリを閉じていても確定・Meet作成・送信まで行う。
- 案内文は候補提示用とは別の設定。日時/形式/会場/Meet/備考/Googleカレンダー追加リンクを差し込む。相手は追加画面で保存を確認する。

## 構成案・安全性

既存の公開meetドキュメントとブラウザ内meetWatchだけでは閉じた状態の確定処理を保証できない。既存Google連携中継とは分離した予約用サーバーを提案。NESTのPhase変更ではなくアプリ内のバックエンド拡張として分類する案。OAuth認可情報のサーバー保管を伴うため、構成確定後に実装する。

- Google Calendar API + Gmail API。必要最小限のgmail.sendとアカウント照合用の認可を追加。送信元を入力値から偽装せず、連携アカウントと一致することをサーバーで確認。
- リフレッシュトークンは暗号化してサーバー専用に保存。ブラウザ/Firestoreの共有リンク/ログへ出さない。解除と失効に対応。
- メールと備考は公開取得可能なmeetドキュメントへ追加しない。オーナー認証と回答者専用の閲覧境界を設ける。
- 回答は候補の範囲内、1予約につき1確定を原子的に保証。レート制限、入力長制限、送信宛先の検証、不正利用防止を行う。
- Googleイベントは予約IDから安定したIDを作り、再試行で複製しない。Meetがpendingの場合は準備完了まで待って案内する。
- 送信成功・未送信・結果不明を区別。Gmail送信のタイムアウトは勝手に再送しない。履歴と手動再送確認を用意する。
- Googleカレンダーへの二重招待を避ける。自由な案内メールとGoogleの招待メールを別々に無条件送信しない。
- TaskAREは次回起動時にサーバーの確定結果を予約IDで取り込み、手入力メモを失わない。
- 旧リンクは旧フローを維持。新旧が同じ予約を処理しない。

## 未実施

サーバー選定・実装・公開、Gmail API有効化、追加同意、認証情報登録、実際の送信/閉じた状態での動作検証。現在のアプリにはメール入力/備考受付をまだ追加していない。

## 公式資料

- [Gmailの送信API](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send)
- [Gmailの権限](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [オフライン認可](https://developers.google.com/identity/protocols/oauth2/web-server)
- [認可情報の保護](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)
