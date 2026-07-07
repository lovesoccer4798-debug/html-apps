# タグ（vX.Y.Z）はGitHubのReleases画面から作る — AIのクラウドセッションはタグをpushできない

- **状況**: リリースのためにAIに `git push origin v1.0.0` でタグを打たせようとしたら、403で拒否された（ブランチのpushは成功するのに）
- **結論**: GitHubの **Releases → Create a new release** 画面からタグを作る。フォームが不安なら、**URLパラメータで入力済みの画面を開ける**（下記）
- **理由**: AIクラウドセッションのgit接続はブランチ（refs/heads）のみ許可で、タグ（refs/tags）のpushを通さない

## 詳細 — URLで入力済みフォームを開く小ワザ

アドレスバーに以下を貼ると、タグ名・対象ブランチ・タイトルが入力済みの状態で開く:

```
https://github.com/<ユーザー名>/<リポジトリ名>/releases/new?tag=v1.0.0&target=main&title=リリース名
```

あとは緑の **Publish release** を押すだけ。タグ選択ドロップダウンと格闘する必要がなくなる。

手で入力する場合の注意: 「Choose a tag」は**選ぶ場所ではなく入力する場所**。検索欄に `v1.0.0` と半角で打つと「+ Create new tag: v1.0.0 on publish」が出現する（何もないのは既存タグが無いだけで正常）。

## 実際に起きた日

2026-07-07。Workspace v1.0.0リリース時にタグpushが2回403になり、Releases画面＋URLパラメータ方式で解決した。
