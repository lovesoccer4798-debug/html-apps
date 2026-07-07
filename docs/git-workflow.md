# Git運用ルール

## ブランチ戦略

シンプルな GitHub Flow を採用する。

- `main` — 常に動く状態を保つ。直接コミットしない。
- 作業ブランチ — `main` から切る。命名規則:

| 種別 | 命名 | 例 |
|---|---|---|
| 機能追加 | `feature/<内容>` | `feature/todo-app` |
| バグ修正 | `fix/<内容>` | `fix/date-format` |
| ドキュメント | `docs/<内容>` | `docs/update-readme` |
| 雑務・整備 | `chore/<内容>` | `chore/setup-linter` |

ブランチ名は英語のケバブケースとする。

## コミット規約（Conventional Commits）

```
<type>: <日本語で変更内容の要約>

（必要なら本文で「なぜ」を説明）
```

| type | 用途 |
|---|---|
| `feat` | 機能追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `refactor` | 動作を変えないコード整理 |
| `test` | テストの追加・修正 |
| `chore` | ビルド・設定・雑務 |

### ルール

- 1コミット＝1つの論理的変更。「ついで修正」を混ぜない。
- 本文には「何を」より「**なぜ**」を書く（「何を」はdiffを見ればわかる）。
- **コミットのタイトル・本文にAIツール名・モデル名を書かない。** どのAIで作業しても履歴の本文が同じ形になることがベンダー中立の条件。ただし、ホスト型ツールが**自動付与するトレーラー**（`Co-Authored-By:` 等）は除去できないため許容する。
- 破壊的変更は type に `!` を付け（例: `feat!:`）、本文で影響を説明する。

## マージ方式

- featureブランチは **squashマージ** を基本とする。AI協働では細かいWIPコミットが増えやすいため、mainの履歴は「1マージ＝1つの論理的変更（≒1タスク）」に畳む。
- squashで失われる作業過程の詳細は、タスクファイルの作業ログに残す（`tasks/README.md` 参照）。
- マージ済みブランチは削除する。

## 日常の操作フロー

```bash
git checkout main && git pull
git checkout -b feature/xxx
# ...作業...
git add -p                 # 変更を確認しながらステージ
git commit -m "feat: ..."
git push -u origin feature/xxx
# → PRを作成（またはローカル運用ならmainにマージ）
```

## 禁止事項

- ❌ `main` への直接push
- ❌ push済みブランチへの `git push --force`（`--force-with-lease` を自分のブランチにのみ許可）
- ❌ 公開履歴の書き換え（rebase済みのものを共有ブランチへ）
- ❌ 秘密情報のコミット（APIキー・トークン・個人情報）。誤ってコミットした場合は即座に鍵をローテーションし、履歴からの除去を検討する

## タグとリリース

- リリース時は `CHANGELOG.md` の `[Unreleased]` をバージョンセクションに繰り上げ、`vX.Y.Z` タグを打つ。
- バージョニングは [Semantic Versioning](https://semver.org/lang/ja/) に従う。
