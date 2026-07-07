# AIがgit pushすると403エラーになる（読み取りはできるのに）

- **状況**: AIツール（Claude Code）にリポジトリへpushさせようとしたら、`Permission denied` の403エラー。読み取りは正常にできていた
- **結論**: GitHub Appの「承認（Authorize）」だけでは書き込めない。**「インストール（Install）」**が別に必要。GitHubの Settings → Applications → 該当App → Configure で、対象リポジトリを Repository access に追加する
- **理由**: 承認＝あなたとしてログインする許可（読み取り）、インストール＝リポジトリへ書き込む権限。この2つは別物

## 詳細

1. https://github.com/apps/claude （または該当AIのAppページ）を開く
2. 右上の **Install**（既に一部インストール済みなら **Configure**）をクリック
3. 自分のアカウントを選ぶ
4. **Only select repositories** を選び、対象リポジトリを追加（All repositoriesより安全）
5. **Install / Save** をクリック

見分け方: 設定画面に「(このApp) has not been installed on any accounts」と表示されていたら、まさにこの状態。

## 実際に起きた日

2026-07-06〜07。ワークスペース初回pushが数時間この403で止まった。
