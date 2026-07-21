# 仕様: Task Calendar — ログインと共有（Firebase・v6第2段階）

- **作成日**: 2026-07-15
- **最終更新**: 2026-07-15
- **ステータス**: Phase A・Phase B 実装済み（2026-07-16）。衝突解決はいずれもドキュメント単位の後勝ち＋差分がないときは書き込まない（無料枠節約）
- **関連**: v6仕様 §4 / ADR予定（SDK同梱）

## 1. 目的

Googleログインで複数端末からデータを使え、**カレンダー単位で他の人と共有**できるようにする（例: 彼女と「俺たち」カレンダーを相互編集）。TimeTreeの共有体験を無料で。

## 2. 前提（無料の担保）

- **Firebase Sparkプラン**: カード登録不要 → 自動課金は構造的に発生しない（無料枠超過時は一時停止のみ）
- 無料枠の目安: Firestore 読取5万/日・書込2万/日・保存1GiB、Auth無制限 → 2人利用なら余裕
- SDKはCDNではなく**リポジトリに同梱**（ADRを書く。オフラインPWAを維持）

## 3. スコープ（段階分け）

### Phase A — ログイン＋自分のデータ同期（バックアップ）

- 設定に「ログイン（Google）」。ログインすると localStorage の全データを Firestore `users/{uid}` に保存・同期
- 端末2台目でログイン → データ復元。オフライン時はローカル動作→復帰時同期（項目ごとの updatedAt で後勝ち）
- ログアウトしてもローカルデータは残る（ローカルファースト）

### Phase B — カレンダー共有（実装メモ: 2026-07-16）

- 設定の「共有カレンダー」で作成 → 招待コード（8桁英数・I/O/0/1除外）発行。相手はコード入力で参加（既定=編集可）
- 実装は `shared/{招待コード}` の1ドキュメント = 1カレンダー（`{title, color, ownerUid, members:{uid:{role,email}}, updatedAt, tasks[], events[]}`）。コード自体が秘密（知っている人だけ参加できる）
- ローカルでは共有項目も db.tasks / db.events に `calendarId='s:コード'` で持つ → チェック・スワイプ・チップ・色・予定表モードが既存コードのまま動く。参加コード一覧（sharedJoined）は自分の users ドキュメントにも同期、タイトル・権限の控え（sharedCache）は端末のみ
- 受信は onSnapshot のリアルタイム購読、送信は3秒デバウンス＋差分がないときは書かない。自分の users ドキュメントには共有項目を含めない（共有ドキュメントが正）
- **メンバーごとの権限をオーナーが設定**（オーナー回答）: 「編集可（既定）／閲覧専用／解除（非表示）」の3段階。オーナーはいつでも変更可
- **メンバーごとの権限をオーナーが設定**（オーナー回答）: 「編集可（既定）／閲覧専用／非表示（見せない）」の3段階。オーナーはいつでも変更可
  - 編集可: 読み書き両方
  - 閲覧専用: 読みのみ（追加・編集・削除ボタンを出さない＋ルールでも書き込み拒否）
  - 解除（非表示）: members から削除 → そのメンバーの端末からカレンダーごと消える。**制約: 同じ招待コードで再参加はできる**ため、完全に見せたくない場合はカレンダーを削除して作り直す（UIのヒントに明記）
- チップに参加カレンダーが並ぶ（自分のと同じ操作感）。退出・オーナーによるメンバー解除あり
- Firestoreセキュリティルール: 本人のuid配下のみ／共有は members[uid].role で判定（editor=読み書き・viewer=読みのみ）。UIだけでなくルールでも権限を強制。オーナーに貼ってもらう最終版:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /shared/{calId} {
      allow get: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.ownerUid == request.auth.uid;
      allow update: if request.auth != null && (
        resource.data.ownerUid == request.auth.uid
        || (resource.data.members[request.auth.uid] != null && resource.data.members[request.auth.uid].role == 'editor')
        || !(request.auth.uid in resource.data.members) // 招待コードを知っている人の参加（自分をmembersへ追加）
      );
      allow delete: if request.auth != null && resource.data.ownerUid == request.auth.uid;
    }
    // スケジュール調整のリンク予約: 相手はログインなしで開くので read/pick を無認証に許可
    match /meet/{code} {
      allow get: if true; // リンク（コード）を知っている相手が候補を読む
      allow create: if request.auth != null && request.resource.data.ownerUid == request.auth.uid;
      allow update: if
        // オーナー本人はいつでも更新できる（確定・Meetリンク・空き枠の同期）
        (request.auth != null && resource.data.ownerUid == request.auth.uid)
        // 相手（未ログイン）は「open→picked」の一度きり。ownerUid/slots は変えられない
        || (resource.data.status == 'open'
            && request.resource.data.status == 'picked'
            && request.resource.data.ownerUid == resource.data.ownerUid
            && request.resource.data.slots == resource.data.slots);
      allow delete: if request.auth != null && resource.data.ownerUid == request.auth.uid;
    }
  }
}
```

### やらないこと（当面）

- リアルタイムの既読・通知、ルーティン/睡眠/メモの共有（共有はカレンダー項目のみ）、アカウント削除以外の管理機能

## 4. エッジケース

- 同じ項目を2人が同時編集 → updatedAt 後勝ち（消えた側の内容は上書き前にローカル履歴へ）
- オフラインで招待コード入力 → オンライン時に再試行を促す
- 無料枠停止時 → 同期エラーを表示しローカル動作を継続（データは失わない）

## 5. 完成の定義（Phase A）

- [ ] Googleログイン→2台目で同じデータが見える。オフライン→復帰で同期
- [ ] ログアウト後もローカルで全機能が動く
- [ ] 全回帰PASS。Firebase設定値はリポジトリに公開してよいもののみ（apiKey等は公開前提の値）

## 6. 論点の決定（2026-07-15 オーナー回答）

1. ログインは**Googleのみ**（Apple/匿名は後回し）
2. **Phase A→Bの2段階**で進める
3. 共有権限は**オーナーがメンバーごとに「編集可（既定）／閲覧専用／非表示」を選べる**（§3 Phase Bに反映）
