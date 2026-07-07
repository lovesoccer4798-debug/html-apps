# 人間にしかできない操作リスト

> 🧭 ここは「**AIには代行できない、GitHubなどの設定画面の操作**」の一覧です。逆に言えば、ここに無い操作はほぼAIに任せられます。

**安心してください**: どの操作も、🤖 AIパートナーが**隣で手順をナビゲートできます**。「いまこの画面が出てる」と伝えながら、一つずつ進めれば大丈夫。実際の手順の詳細は 💡 [knowledge/](../knowledge/README.md) にあります（すべて実体験済み）。

## 一覧

| 操作 | いつ必要になるか | 手順の記録 |
|---|---|---|
| **GitHub Appのインストール・権限付与** | AIツールを新しく連携するとき／pushが403になったとき | [knowledge: 403の解決](../knowledge/20260707-github-app-permission-403.md) |
| **タグ・リリースの作成** | バージョン（v1.0.0など）を打つとき | [knowledge: Releases画面から作る](../knowledge/20260707-create-tag-via-releases.md) |
| **デフォルトブランチの変更** | リポジトリ立ち上げ直後 | [knowledge: 変更手順](../knowledge/20260707-change-default-branch.md) |
| **GitHub Pagesの有効化** | アプリをWebに公開するとき（Journey Level 5・Portal公開） | 下記「GitHub Pagesの有効化手順」 |
| **リポジトリの作成・リネーム・公開範囲変更** | 新しい巣を作るとき／Starter Kit利用時 | GitHubの New repository / Settings → General |
| **アカウント系の操作**（パスワード・2段階認証・課金） | 各サービスの初期設定 | 各サービスの設定画面（秘密情報なのでAIに見せない） |

## GitHub Pagesの有効化手順

1. リポジトリページ → **Settings** タブ → 左メニューの **Pages**
2. 「Build and deployment」の **Source** が「Deploy from a branch」になっていることを確認
3. **Branch** で `main` を選び、フォルダは `/ (root)` のまま → **Save**
4. 数分待つと、ページ上部に公開URL（`https://<ユーザー名>.github.io/<リポジトリ名>/`）が表示される

## なぜAIにできないのか

AIのGitHub接続は「コードの読み書き」に限定されており、**設定画面（Settings）はあなたのアカウントの権限でしか触れない**ためです。これはセキュリティ上むしろ望ましい制限です — AIが勝手にリポジトリを公開したり削除したりできない、ということでもあります。

## この表の育て方

新しく「AIに頼んだらできなかった操作」に出会ったら、knowledgeに記録してからこの表に1行追加する。

---

📍 **戻る**: [Handbook表紙](README.md)　|　**関連**: [AIツール案内](ai-tools.md)
