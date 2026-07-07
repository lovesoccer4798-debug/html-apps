# AIツール別セットアップ — ベンダー知識の検疫所

このワークスペースのルール本体は [`AGENTS.md`](../AGENTS.md) にあり、ベンダー非依存である。しかし「各AIツールにどうやってAGENTS.mdを読ませるか」だけはベンダー固有の知識になる。**その知識はこのファイルにのみ書く**（他のドキュメントに散らばらせない）。

## はじめてAIを使う人へ

AIをまだ持っていない場合は、**無料で始められるチャットAIをひとつ**用意すれば十分です（2026年現在: Claude・ChatGPT・Geminiのいずれも無料プランがあり、どれでもNESTのプロンプトは動きます）。迷ったら、どれか一つに登録して `prompts/hello-nest.md` を貼ってみてください。NESTは特定のAIに依存しないので、後から乗り換えても何も失いません。

## 対応状況

| ツール | ルールの読み込ませ方 | 状態 |
|---|---|---|
| Claude Code | `CLAUDE.md`（スタブ）を自動読込 → AGENTS.mdへ誘導 | ✅ 動作確認済み |
| OpenAI Codex | `AGENTS.md` をネイティブに自動読込。スタブ不要 | 未検証 |
| Cursor | `AGENTS.md` をネイティブに自動読込。スタブ不要 | 未検証 |
| Gemini CLI | `GEMINI.md`（スタブ）を自動読込。設定でスタブを不要にできる（下記） | 未検証 |
| Windsurf | `.windsurf/rules/workspace.md`（スタブ）を自動読込 | 未検証 |

各ツールを初めて使ったら「AGENTS.mdのルールを認識しているか」を確認し（例:「このリポジトリの作業ルールを要約して」と聞く）、この表の状態を更新すること。

## ツール別メモ

### Gemini CLI

`.gemini/settings.json` に以下を書くと、スタブを経由せず `AGENTS.md` を直接読ませられる:

```json
{ "contextFileName": "AGENTS.md" }
```

### Claude Code（ウェブ版）の既知の制約

- **書き込みにはGitHub Appのインストールが必要。** OAuth承認（Authorized GitHub Apps）だけでは読み取りのみで、pushは403になる。GitHubの Settings → Applications → Claude → Configure で対象リポジトリが **Repository access** に含まれていることを確認する。
- **タグはpushできない**（ブランチのみ許可）。タグとリリースはGitHubの Releases 画面から作成する。入力済みフォームを開くURLパラメータが便利:
  `https://github.com/<owner>/<repo>/releases/new?tag=v1.0.0&target=main&title=リリース名`

### コミットトレーラーについて

ホスト型ツール（Claude Codeのウェブ版など）はコミットに `Co-Authored-By:` 等のトレーラーを自動付与する。これは除去できないため許容している（`docs/git-workflow.md` 参照）。

## NotebookLM運用 — 同期フロー（正式ルール）

NotebookLMは「質問できる先生」だが、**アップロードしたファイルは自動更新されない**。古い答えを返す先生は、正本より派生物が嘘をつく状態そのもの。以下のフローで防ぐ。

### 同期のタイミング

1. **Phaseの完了ごと**（`docs/reviews/` に記録が増えたとき）— これが基本
2. **月1回の点検** — 忘れていてもここで回収する
3. 思想層・Handbookに大きな変更があったとき（随時）

### 同期対象リスト（この一覧だけ同期する）

`README.md`／`START_HERE.md`／`docs/philosophy/` の7ファイル／`docs/README.md`・`glossary.md`・`vocabulary.md`・`human-only-operations.md`・`starter-kit.md`・`roadmap.md`／`knowledge/` 全ファイル／`tasks/STATUS.md`

（コード・テンプレート・ADR・タスクファイルは同期しない — 質問対象になる「読み物」だけ）

### 手順（初心者でも5分）

1. NotebookLMのNESTノートブックを開く
2. 前回同期以降に**変更・追加されたファイル**を、ソースから削除→再アップロードする（迷ったら全部入れ替えてよい。対象リストの通りに）
3. **検収質問を3つ投げる**:
   - 「NESTの六箇条を教えて」（憲法が読めているか）
   - 「はじめてモードとは？」（Handbookが読めているか）
   - 「**いちばん最近完了したPhaseは？**」（← 最新情報が入ったかの決め手）
4. 3問すべてが正本と一致したら完了。`tasks/STATUS.md` の申し送りに `NotebookLM同期: YYYY-MM-DD` を記録する

### 完了条件

検収質問3問への正答＋STATUSへの日付記録。**「アップロードした」は完了ではない**（正しく答えて初めて同期）。

### 大原則（再掲）

書くのは常にリポジトリ側。NotebookLMの回答から得た気づきは `knowledge/` へ書き写す。NotebookLMが消えてもNESTは無傷（このセクションを削除するだけ）。

## 新しいAIツールを導入する手順

1. そのツールが `AGENTS.md` をネイティブに読むか確認する。読むならスタブ不要。
2. 読まないなら、そのツールが読むファイル（例: `.foorc.md`）に `CLAUDE.md` と同形式のスタブ（AGENTS.mdへの参照のみ）を作る。
3. 上の対応状況の表に1行追加する。
4. ルールを認識しているか動作確認し、状態を「✅ 動作確認済み」にする。

## チャット型AI（ファイルを読めないWeb UI）に渡す場合

`README.md` → `AGENTS.md` → `tasks/STATUS.md` → 対象タスク → 対象仕様書の順に本文をコピーして渡す。頻繁に必要になるようなら、連結スクリプトの導入を検討する（`tasks/STATUS.md` の申し送り参照）。
