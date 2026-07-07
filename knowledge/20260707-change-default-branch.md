# デフォルトブランチをmainに変更する手順（人間の操作が必要）

- **状況**: 空のリポジトリに最初にpushしたブランチが、そのままデフォルトブランチになってしまった（`main` にしたい）
- **結論**: GitHubの **Settings → General → Default branch** の ⇄（入れ替え）アイコンから変更する。AIには代行できないので人間がやる
- **理由**: GitHubは「最初にpushされたブランチ」を自動でデフォルトにする仕様。変更はリポジトリ設定画面の操作で、AIのgit接続からは触れない

## 詳細

1. リポジトリページ → **Settings** タブ → 左メニューの **General**
2. **Default branch** の欄で ⇄ アイコンをクリック
3. `main` を選択 → **Update**
4. 確認ダイアログ「I understand, update the default branch.」をクリック

先にmainブランチ自体が存在している必要がある（無ければ `git push origin HEAD:refs/heads/main` などで作ってから）。

## 実際に起きた日

2026-07-07。初回pushで作業ブランチがデフォルトになり、PR作成が失敗する原因になった（詳細は `20260707-pr-needs-two-branches.md`）。
